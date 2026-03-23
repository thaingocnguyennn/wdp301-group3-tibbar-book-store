import supportService from '../services/supportService.js';
import SupportConversation from '../models/SupportConversation.js';
import User from '../models/User.js';
import { ROLES } from '../config/constants.js';
import { verifyAccessToken } from '../utils/tokenHelper.js';

// Map to store socket info: socketId -> { userId, role, conversationId }
const socketInfo = new Map();

const setupSupportSocket = (io) => {
  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    const decoded = verifyAccessToken(token);

    if (!decoded?.userId) {
      return next(new Error('Authentication failed'));
    }

    try {
      const user = await User.findById(decoded.userId).select('_id role isActive');
      if (!user || !user.isActive) {
        return next(new Error('Authentication failed'));
      }

      socket.userId = user._id.toString();
      socket.userRole = user.role;
      next();
    } catch (_error) {
      return next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ User ${socket.userId} connected with socket ${socket.id}`);

    // Customer joins their conversation room
    socket.on('customer:join', async (data) => {  
      const { conversationId } = data;
      
      if (!conversationId) {
        socket.emit('error', { message: 'Conversation ID is required' });
        return;
      }

      // Verify customer owns this conversation
      const conversation = await SupportConversation.findById(conversationId);
      if (!conversation || conversation.customer.toString() !== socket.userId) {
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }

      socket.join(`conversation:${conversationId}`);
      socket.join(`customer:${conversationId}`);
      
      socketInfo.set(socket.id, {
        userId: socket.userId,
        role: 'customer',
        conversationId,
      });

      // Mark admin messages as read
      await supportService.markAdminMessagesAsRead(conversationId);

      console.log(`👥 Customer joined conversation: ${conversationId}`);
      socket.emit('customer:joined', { conversationId });
    });

    // Admin joins all conversations or specific ones
    socket.on('admin:join', async () => {
      if (socket.userRole !== ROLES.ADMIN) {
        socket.emit('error', { message: 'Only admins can join' });
        return;
      }

      socket.join('admin:support');
      socketInfo.set(socket.id, {
        userId: socket.userId,
        role: 'admin',
        conversationId: null,
      });

      console.log(`👨‍💼 Admin joined support room with socket ${socket.id}`);
      socket.emit('admin:joined', { message: 'Connected to support inbox' });
    });

    // Admin views a specific conversation
    socket.on('admin:view-conversation', async (data) => {
      const { conversationId } = data;

      if (socket.userRole !== ROLES.ADMIN) {
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }

      const info = socketInfo.get(socket.id);
      if (info) {
        // Leave previous conversation if any
        if (info.conversationId) {
          socket.leave(`conversation:${info.conversationId}`);
        }
      }

      // Update socket info
      socketInfo.set(socket.id, {
        userId: socket.userId,
        role: 'admin',
        conversationId,
      });

      socket.join(`conversation:${conversationId}`);
      socket.join(`admin:${conversationId}`);

      // Mark customer messages as read for this conversation
      await supportService.markCustomerMessagesAsRead(conversationId);

      console.log(`👨‍💼 Admin viewing conversation: ${conversationId}`);
      socket.emit('admin:viewing-conversation', { conversationId });
    });

    // Customer sends a message
    socket.on('customer:send-message', async (data) => {
      const { content } = data;

      if (socket.userRole !== ROLES.CUSTOMER) {
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }

      try {
        const message = await supportService.sendCustomerMessage(socket.userId, content);
        const roomConversationId = message.conversation.toString();

        // Populate sender details
        const populatedMessage = await message.populate('sender', 'firstName lastName email role');

        // Broadcast to all in this conversation
        io.to(`conversation:${roomConversationId}`).emit('message:new', {
          conversationId: roomConversationId,
          message: populatedMessage,
          senderRole: 'customer',
        });

        // Notify admins in support room
        io.to('admin:support').emit('message:new', {
          conversationId: roomConversationId,
          message: populatedMessage,
          senderRole: 'customer',
        });

        socket.emit('customer:message-sent', { messageId: message._id });
      } catch (error) {
        socket.emit('error', { message: error.message || 'Failed to send message' });
      }
    });

    // Admin sends a message
    socket.on('admin:send-message', async (data) => {
      const { conversationId, content } = data;

      if (socket.userRole !== ROLES.ADMIN) {
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }

      try {
        const message = await supportService.sendAdminMessage(socket.userId, conversationId, content);

        // Populate sender details
        const populatedMessage = await message.populate('sender', 'firstName lastName email role');

        // Broadcast to all in this conversation
        io.to(`conversation:${conversationId}`).emit('message:new', {
          conversationId,
          message: populatedMessage,
          senderRole: 'admin',
        });

        socket.emit('admin:message-sent', { messageId: message._id });
      } catch (error) {
        socket.emit('error', { message: error.message || 'Failed to send message' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      const info = socketInfo.get(socket.id);
      socketInfo.delete(socket.id);

      console.log(`❌ User ${socket.userId} disconnected`);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`❌ Socket error for ${socket.userId}:`, error);
    });
  });
};

export default setupSupportSocket;
