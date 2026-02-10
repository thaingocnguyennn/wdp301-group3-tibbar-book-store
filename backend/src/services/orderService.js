import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Book from "../models/Book.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import { MESSAGES, SHIPPING } from "../config/constants.js";
import paymentService from "./paymentService.js";

class OrderService {
  // Calculate shipping fee based on subtotal
  calculateShippingFee(subtotalVnd) {
    // Free shipping for orders > 200,000 VND
    if (subtotalVnd > SHIPPING.FREE_THRESHOLD) {
      return 0;
    }
    return SHIPPING.FEE;
  }

  // Generate unique order number
  generateOrderNumber() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `ORD${timestamp}${random}`;
  }

  // Validate cart before creating order
  async validateCartForCheckout(userId) {
    console.log("🔍 [OrderService] Validating cart for user:", userId);

    const cart = await Cart.findOne({ user: userId }).populate("items.book");

    console.log("📦 [OrderService] Cart found:", {
      cartExists: !!cart,
      itemsCount: cart?.items?.length || 0,
      items: cart?.items?.map(item => ({
        bookId: item.book?._id,
        bookTitle: item.book?.title,
        quantity: item.quantity
      }))
    });

    if (!cart || !cart.items || cart.items.length === 0) {
      console.error("❌ [OrderService] Cart validation failed: Cart is empty");
      throw ApiError.badRequest("Cart is empty");
    }

    const validationErrors = [];
    const validItems = [];

    for (const item of cart.items) {
      if (!item.book) {
        validationErrors.push({ message: "Book not found", itemId: item._id });
        continue;
      }

      if (item.quantity <= 0) {
        validationErrors.push({
          message: "Invalid quantity",
          book: item.book.title,
        });
        continue;
      }

      if (item.book.stock < item.quantity) {
        validationErrors.push({
          message: `Not enough stock. Available: ${item.book.stock}`,
          book: item.book.title,
        });
        continue;
      }

      if (!item.book.price || item.book.price <= 0) {
        validationErrors.push({
          message: "Invalid price",
          book: item.book.title,
        });
        continue;
      }

      validItems.push(item);
    }

    if (validationErrors.length > 0) {
      throw ApiError.badRequest("Cart validation failed", { errors: validationErrors });
    }

    return { cart, validItems };
  }

  // Calculate order totals
  calculateOrderTotals(items, voucherDiscount = 0, shippingFee = 0) {
    const subtotal = items.reduce((sum, item) => {
      return sum + item.book.price * item.quantity;
    }, 0);

    const discount = voucherDiscount;
    const total = subtotal + shippingFee - discount;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discount: Math.round(discount * 100) / 100,
      shippingFee: Math.round(shippingFee * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }

  // Create order
  async createOrder(userId, orderData) {
    const {
      paymentMethod = "COD",
      shippingAddressId = "MOCK_ADDRESS_ID",
      voucherId = null,
      notes = "",
      ipAddress = "127.0.0.1",
    } = orderData;

    // Validate payment method
    const paymentProvider = paymentService.getProvider(paymentMethod);
    const canPay = await paymentProvider.canPay();
    if (!canPay) {
      throw ApiError.badRequest(`Payment method ${paymentMethod} is not available`);
    }

    // Validate cart
    const { cart, validItems } = await this.validateCartForCheckout(userId);

    // Calculate subtotal first
    const subtotal = validItems.reduce((sum, item) => {
      return sum + item.book.price * item.quantity;
    }, 0);

    // Calculate shipping fee based on subtotal (free if > 200,000 VND)
    const shippingFee = this.calculateShippingFee(subtotal);

    // Calculate totals (voucher support placeholder - will be 0 for now)
    const voucherDiscount = 0; // TODO: Calculate from voucherId when voucher module is ready
    const totals = this.calculateOrderTotals(validItems, voucherDiscount, shippingFee);

    // Generate order number
    const orderNumber = this.generateOrderNumber();

    // Prepare order items with snapshot of book data
    const orderItems = validItems.map((item) => ({
      book: item.book._id,
      title: item.book.title,
      author: item.book.author,
      price: item.book.price,
      quantity: item.quantity,
      subtotal: Math.round(item.book.price * item.quantity * 100) / 100,
    }));

    // Create payment
    console.log("💳 [OrderService] Creating payment with provider:", paymentMethod);
    console.log("💰 [OrderService] Payment details:", {
      orderNumber,
      total: totals.total,
      ipAddress
    });

    const paymentResult = await paymentProvider.createPayment({
      orderNumber,
      total: totals.total,
      ipAddress,
    });

    console.log("✅ [OrderService] Payment created:", {
      paymentMethod: paymentResult.paymentMethod,
      paymentStatus: paymentResult.paymentStatus,
      hasQrCode: !!paymentResult.qrCodeUrl
    });

    console.log("✅ [OrderService] Payment created:", {
      paymentMethod: paymentResult.paymentMethod,
      paymentStatus: paymentResult.paymentStatus,
      hasQrCode: !!paymentResult.qrCodeUrl
    });

    // Create order in database
    console.log("📝 [OrderService] Creating order in database...");
    const order = await Order.create({
      orderNumber,
      user: userId,
      items: orderItems,
      subtotal: totals.subtotal,
      discount: totals.discount,
      shippingFee: totals.shippingFee,
      total: totals.total,
      paymentMethod,
      paymentStatus: paymentResult.paymentStatus,
      orderStatus: "PENDING",
      shippingAddress: shippingAddressId,
      voucher: voucherId,
      notes,
      transactionId: paymentResult.transactionId || null,
    });

    // Update book stock safely (prevent overselling)
    for (const item of validItems) {
      const updatedBook = await Book.findOneAndUpdate(
        {
          _id: item.book._id,
          stock: { $gte: item.quantity }, // only update if enough stock
        },
        {
          $inc: { stock: -item.quantity },
        },
        { new: true }
      );

      if (!updatedBook) {
        throw ApiError.badRequest(
          `Product "${item.book.title}" is out of stock or not enough quantity available.`
        );
      }
    }


    // Clear cart only after successful order creation
    await Cart.findByIdAndUpdate(cart._id, { items: [] });

    // Populate order details
    await order.populate("items.book user");

    console.log("🎉 [OrderService] Order created successfully:", {
      orderNumber: order.orderNumber,
      orderId: order._id,
      total: order.total,
      paymentMethod: order.paymentMethod
    });

    return {
      order,
      payment: paymentResult,
    };
  }

  // Get user orders
  async getUserOrders(userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({ user: userId })
        .populate("items.book")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments({ user: userId }),
    ]);

    return {
      orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Admin: get all orders with filters
  async getAllOrders({ page = 1, limit = 10, status, paymentStatus, search, userId } = {}) {
    const skip = (page - 1) * limit;
    const filter = {};

    if (status && status !== "all") {
      filter.orderStatus = status;
    }

    if (paymentStatus && paymentStatus !== "all") {
      filter.paymentStatus = paymentStatus;
    }

    if (userId) {
      filter.user = userId;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      const matchedUsers = await User.find({
        $or: [
          { email: searchRegex },
          { firstName: searchRegex },
          { lastName: searchRegex },
        ],
      }).select("_id");

      const userIds = matchedUsers.map((user) => user._id);

      filter.$or = [
        { orderNumber: searchRegex },
        ...(userIds.length ? [{ user: { $in: userIds } }] : []),
      ];
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("items.book")
        .populate("user", "email firstName lastName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    return {
      orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Admin: get order by ID
  async getOrderByIdAdmin(orderId) {
    const order = await Order.findById(orderId)
      .populate("items.book")
      .populate("user", "email firstName lastName")
      .lean();

    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    return order;
  }

  // Admin: update order status
  async updateOrderStatus(orderId, status) {
    const allowedStatuses = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

    if (!allowedStatuses.includes(status)) {
      throw ApiError.badRequest("Invalid order status");
    }

    const order = await Order.findById(orderId);

    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    order.orderStatus = status;

    if (status === "DELIVERED" && !order.deliveredAt) {
      order.deliveredAt = new Date();
    }

    await order.save();

    await order.populate("items.book user");

    return order;
  }

  // Get order by ID
  async getOrderById(orderId, userId) {
    const order = await Order.findById(orderId)
      .populate("items.book")
      .populate("user", "name email")
      .lean();

    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    // Verify order belongs to user (unless admin - will add admin check later)
    if (order.user._id.toString() !== userId.toString()) {
      throw ApiError.forbidden("You are not authorized to view this order");
    }

    return order;
  }

  // Get order by order number
  async getOrderByNumber(orderNumber, userId) {
    const order = await Order.findOne({ orderNumber })
      .populate("items.book")
      .populate("user", "name email")
      .lean();

    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    // Verify order belongs to user
    if (order.user._id.toString() !== userId.toString()) {
      throw ApiError.forbidden("You are not authorized to view this order");
    }

    return order;
  }

  // Confirm payment (for VNPAY callback)
  async confirmPayment(orderNumber, callbackParams) {
    const order = await Order.findOne({ orderNumber });

    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    if (order.paymentStatus === "PAID") {
      return order; // Already paid
    }

    // Get payment provider
    const paymentProvider = paymentService.getProvider(order.paymentMethod);
    const confirmResult = await paymentProvider.confirmPayment(callbackParams);

    // Update order payment status
    order.paymentStatus = confirmResult.paymentStatus;

    if (confirmResult.success) {
      order.transactionId = confirmResult.transactionId || order.transactionId;
      order.paidAt = new Date();
      order.orderStatus = "PROCESSING"; // Move to processing after payment
    } else {
      order.orderStatus = "PENDING"; // Keep pending if payment failed
    }

    await order.save();

    return {
      order,
      payment: confirmResult,
    };
  }

  // Cancel order (user can cancel only if order is PENDING)
  async cancelOrder(orderId, userId) {
    const order = await Order.findById(orderId);

    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    if (order.user.toString() !== userId.toString()) {
      throw ApiError.forbidden("You are not authorized to cancel this order");
    }

    if (order.orderStatus !== "PENDING") {
      throw ApiError.badRequest("Order cannot be cancelled at this stage");
    }

    order.orderStatus = "CANCELLED";
    await order.save();

    // Restore book stock
    for (const item of order.items) {
      await Book.findByIdAndUpdate(item.book, {
        $inc: { stock: item.quantity },
      });
    }

    return order;
  }

  // Get available payment methods
  async getAvailablePaymentMethods() {
    return await paymentService.getAvailablePaymentMethods();
  }

  // Confirm VietQR payment manually (Admin function)
  async confirmVietQRPayment(orderNumber) {
    const order = await Order.findOne({ orderNumber });

    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    if (order.paymentMethod !== "VIETQR") {
      throw ApiError.badRequest("This order is not a VietQR payment");
    }

    if (order.paymentStatus === "PAID") {
      return { order, message: "Payment already confirmed" };
    }

    // Update order payment status
    order.paymentStatus = "PAID";
    order.paidAt = new Date();
    order.orderStatus = "PROCESSING";

    await order.save();

    console.log("✅ [OrderService] VietQR payment confirmed:", {
      orderNumber,
      orderId: order._id,
    });

    return { order, message: "Payment confirmed successfully" };
  }
  async getRevenue(range) {
    const filter = { status: "completed" };

    const now = new Date();

    if (range === "today") {
      filter.createdAt = {
        $gte: new Date(now.setHours(0, 0, 0, 0))
      };
    }

    if (range === "month") {
      filter.createdAt = {
        $gte: new Date(now.getFullYear(), now.getMonth(), 1)
      };
    }

    if (range === "year") {
      filter.createdAt = {
        $gte: new Date(now.getFullYear(), 0, 1)
      };
    }

    const orders = await Order.find(filter);

    const totalRevenue = orders.reduce(
      (sum, order) => sum + order.totalPrice,
      0
    );

    return {
      totalRevenue,
      totalOrders: orders.length
    };
  }

}

export default new OrderService();
