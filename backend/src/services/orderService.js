import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Book from "../models/Book.js";
import User from "../models/User.js";
import Voucher from "../models/Voucher.js";
import UserVoucher from "../models/UserVoucher.js";
import ApiError from "../utils/ApiError.js";
import { MESSAGES, SHIPPING } from "../config/constants.js";
import paymentService from "./paymentService.js";
import coinService from "./coinService.js";
import { ROLES } from "../config/constants.js";

const MAX_ORDERS = 20;
const RETURN_REQUEST_WINDOW_DAYS = 7;
const ADMIN_STATUS_TRANSITIONS = {
  PENDING: ["PROCESSING"],
  PROCESSING: ["SHIPPED"],
};
class OrderService {
  escapeHtml(value = "") {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  formatCurrencyVnd(amount = 0) {
    return `${Number(amount || 0).toLocaleString("vi-VN")}₫`;
  }

  buildOrderItemsSignature(items = []) {
    return items
      .map((item) => {
        const bookId =
          item.book?._id?.toString?.() || item.book?.toString?.() || "";
        const quantity = Number(item.quantity || 0);
        return `${bookId}:${quantity}`;
      })
      .sort()
      .join("|");
  }

  async findRecentDuplicateOrder(
    userId,
    orderItems,
    total,
    withinSeconds = 30,
  ) {
    const fromDate = new Date(Date.now() - withinSeconds * 1000);
    const targetSignature = this.buildOrderItemsSignature(orderItems);

    const recentOrders = await Order.find({
      user: userId,
      createdAt: { $gte: fromDate },
      orderStatus: { $ne: "CANCELLED" },
    })
      .select("orderNumber items total")
      .lean();

    return (
      recentOrders.find((order) => {
        const signature = this.buildOrderItemsSignature(order.items || []);
        const isSameItems = signature === targetSignature;
        const isSameTotal =
          Math.abs(Number(order.total || 0) - Number(total || 0)) < 0.01;
        return isSameItems && isSameTotal;
      }) || null
    );
  }

  async reserveStockForOrderItems(orderItems) {
    const reservations = [];

    try {
      for (const item of orderItems) {
        const updatedBook = await Book.findOneAndUpdate(
          {
            _id: item.book,
            stock: { $gte: item.quantity },
          },
          {
            $inc: { stock: -item.quantity },
          },
          { new: true },
        );

        if (!updatedBook) {
          throw ApiError.badRequest(
            `Product \"${item.title}\" is out of stock or not enough quantity available.`,
          );
        }

        reservations.push({
          book: item.book,
          quantity: item.quantity,
        });
      }

      return reservations;
    } catch (error) {
      await this.restoreStockReservations(reservations);
      throw error;
    }
  }

  async restoreStockReservations(reservations = []) {
    for (const reservation of reservations) {
      await Book.findByIdAndUpdate(reservation.book, {
        $inc: { stock: reservation.quantity },
      });
    }
  }

  async rollbackOrderCreation({
    order = null,
    userId = null,
    coinsDeducted = 0,
    stockReservations = [],
  }) {
    try {
      if (order?.shipper) {
        await User.findByIdAndUpdate(order.shipper, {
          $inc: { currentOrders: -1 },
        });
      }

      if (order?._id) {
        await Order.findByIdAndDelete(order._id);
      }

      if (coinsDeducted > 0 && userId) {
        await coinService.addCoins(
          userId,
          coinsDeducted,
          `Rollback coin deduction for failed order flow`,
          "ADMIN_ADJUST",
        );
      }

      if (stockReservations.length > 0) {
        await this.restoreStockReservations(stockReservations);
      }
    } catch (rollbackError) {
      console.error("❌ [OrderService] Rollback failed:", rollbackError);
    }
  }

  getReturnRequestWindowInfo(order) {
    if (!order?.deliveredAt) {
      return {
        allowed: false,
        expiresAt: null,
        remainingDays: 0,
      };
    }

    const deliveredAt = new Date(order.deliveredAt);
    const expiresAt = new Date(deliveredAt);
    expiresAt.setDate(expiresAt.getDate() + RETURN_REQUEST_WINDOW_DAYS);

    const now = new Date();
    const diffMs = expiresAt.getTime() - now.getTime();
    const remainingDays = Math.max(
      0,
      Math.ceil(diffMs / (1000 * 60 * 60 * 24)),
    );

    return {
      allowed: diffMs >= 0,
      expiresAt,
      remainingDays,
    };
  }

  buildInvoiceHtml(order) {
    const rowsHtml = order.items
      .map((item) => {
        return `
          <tr>
            <td>${this.escapeHtml(item.title)}</td>
            <td style="text-align:center;">${Number(item.quantity || 0)}</td>
            <td style="text-align:right;">${this.formatCurrencyVnd(item.price)}</td>
            <td style="text-align:right;">${this.formatCurrencyVnd(item.subtotal)}</td>
          </tr>
        `;
      })
      .join("");

    const customerName =
      order.shippingAddress?.fullName ||
      [order.user?.firstName, order.user?.lastName].filter(Boolean).join(" ") ||
      "Customer";
    const orderDate = new Date(order.createdAt).toLocaleString("vi-VN");
    const shippingAddress = [
      order.shippingAddress?.description,
      order.shippingAddress?.commune,
      order.shippingAddress?.district,
      order.shippingAddress?.province,
    ]
      .filter(Boolean)
      .map((segment) => this.escapeHtml(segment))
      .join(", ");

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice ${this.escapeHtml(order.orderNumber)}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #1f2937; margin: 24px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 24px; }
    .brand { font-size: 24px; font-weight: 700; color: #111827; }
    .muted { color: #6b7280; font-size: 13px; }
    .card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { border-bottom: 1px solid #e5e7eb; padding: 10px 8px; font-size: 14px; }
    th { background: #f9fafb; text-align: left; color: #374151; }
    .summary { width: 360px; margin-left: auto; margin-top: 16px; }
    .summary-row { display: flex; justify-content: space-between; margin: 6px 0; font-size: 14px; }
    .summary-total { font-size: 18px; font-weight: 700; border-top: 1px solid #d1d5db; padding-top: 10px; margin-top: 10px; }
    @media print { body { margin: 8mm; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">Tibbar Book Store</div>
      <div class="muted">Invoice for completed order</div>
    </div>
    <div style="text-align:right;">
      <div><strong>Invoice #</strong> ${this.escapeHtml(order.orderNumber)}</div>
      <div class="muted">${orderDate}</div>
    </div>
  </div>

  <div class="card">
    <div><strong>Customer:</strong> ${this.escapeHtml(customerName)}</div>
    <div><strong>Phone:</strong> ${this.escapeHtml(order.shippingAddress?.phone || "")}</div>
    <div><strong>Email:</strong> ${this.escapeHtml(order.user?.email || "")}</div>
    <div><strong>Address:</strong> ${shippingAddress || "N/A"}</div>
  </div>

  <div class="card">
    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th style="text-align:center;">Qty</th>
          <th style="text-align:right;">Price</th>
          <th style="text-align:right;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <div class="summary">
      <div class="summary-row"><span>Subtotal</span><span>${this.formatCurrencyVnd(order.subtotal)}</span></div>
      <div class="summary-row"><span>Discount</span><span>-${this.formatCurrencyVnd(order.discount)}</span></div>
      <div class="summary-row"><span>Coins Used</span><span>-${this.formatCurrencyVnd(order.coinsUsed)}</span></div>
      <div class="summary-row"><span>Shipping Fee</span><span>${this.formatCurrencyVnd(order.shippingFee)}</span></div>
      <div class="summary-row summary-total"><span>Total</span><span>${this.formatCurrencyVnd(order.total)}</span></div>
    </div>
  </div>
</body>
</html>`;
  }

  normalizeDateBoundary(dateString, isEndOfDay = false) {
    const parsedDate = new Date(dateString);

    if (Number.isNaN(parsedDate.getTime())) {
      throw ApiError.badRequest("Invalid date filter format");
    }

    if (isEndOfDay) {
      parsedDate.setHours(23, 59, 59, 999);
    } else {
      parsedDate.setHours(0, 0, 0, 0);
    }

    return parsedDate;
  }

  getAdminAllowedStatuses(currentStatus) {
    return ADMIN_STATUS_TRANSITIONS[currentStatus] || [];
  }

  validateAdminStatusTransition(currentStatus, nextStatus) {
    const allowedStatuses = this.getAdminAllowedStatuses(currentStatus);

    if (!allowedStatuses.includes(nextStatus)) {
      throw ApiError.badRequest(
        `Invalid status transition: ${currentStatus} -> ${nextStatus}. Allowed: ${allowedStatuses.join(", ") || "none"}`,
      );
    }
  }

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
      items: cart?.items?.map((item) => ({
        bookId: item.book?._id,
        bookTitle: item.book?.title,
        quantity: item.quantity,
      })),
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
      // validate stock before create order
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
      throw ApiError.badRequest("Cart validation failed", {
        errors: validationErrors,
      });
    }

    return { cart, validItems };
  }

  // Calculate order totals
  calculateOrderTotals(
    items,
    voucherDiscount = 0,
    shippingFee = 0,
    coinDiscount = 0,
  ) {
    const subtotal = items.reduce((sum, item) => {
      return sum + item.book.price * item.quantity;
    }, 0);

    const discount = voucherDiscount;
    const total = subtotal + shippingFee - discount - coinDiscount;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discount: Math.round(discount * 100) / 100,
      shippingFee: Math.round(shippingFee * 100) / 100,
      coinDiscount: Math.round(coinDiscount * 100) / 100,
      total: Math.max(0, Math.round(total * 100) / 100), // Ensure total is never negative
    };
  }

  validateVoucherEligibility(voucher, orderAmount) {
    if (!voucher) {
      throw ApiError.badRequest("Voucher not found");
    }

    if (!voucher.isActive) {
      throw ApiError.badRequest("Voucher is inactive");
    }

    const now = new Date();
    if (voucher.expiryDate && new Date(voucher.expiryDate) < now) {
      throw ApiError.badRequest("Voucher has expired");
    }

    if (orderAmount < Number(voucher.minOrderValue || 0)) {
      throw ApiError.badRequest(
        `Order does not meet minimum value of ${Number(voucher.minOrderValue || 0).toLocaleString("vi-VN")}₫`,
      );
    }
  }

  calculateVoucherDiscount(voucher, orderAmount) {
    let discount = 0;

    if (voucher.discountType === "PERCENT") {
      discount = (orderAmount * Number(voucher.discountValue)) / 100;

      if (
        voucher.maxDiscountValue !== null &&
        voucher.maxDiscountValue !== undefined
      ) {
        discount = Math.min(discount, Number(voucher.maxDiscountValue));
      }
    } else {
      discount = Number(voucher.discountValue);
    }

    discount = Math.min(discount, orderAmount);

    return Math.round(discount * 100) / 100;
  }

  validateUserVoucherEligibility(userVoucher) {
    if (!userVoucher) {
      throw ApiError.badRequest("This voucher is not assigned to your account");
    }

    const now = new Date();
    if (userVoucher.status === "EXPIRED") {
      throw ApiError.badRequest("Your assigned voucher has expired");
    }

    if (userVoucher.expiresAt && new Date(userVoucher.expiresAt) < now) {
      throw ApiError.badRequest("Your assigned voucher has expired");
    }

    const usageCount = Number(userVoucher.usageCount || 0);
    const maxUsage = Number(userVoucher.maxUsage || 1);

    if (usageCount >= maxUsage) {
      throw ApiError.badRequest("Your assigned voucher has been fully used");
    }
  }

  async consumeAssignedVoucherUsage(userVoucherId) {
    const assignedVoucher = await UserVoucher.findById(userVoucherId);
    if (!assignedVoucher) {
      return;
    }

    const nextUsage = Number(assignedVoucher.usageCount || 0) + 1;
    const maxUsage = Number(assignedVoucher.maxUsage || 1);

    assignedVoucher.usageCount = nextUsage;
    assignedVoucher.usedAt = new Date();
    assignedVoucher.status = nextUsage >= maxUsage ? "USED" : "UNUSED";

    await assignedVoucher.save();
  }

  async resolveVoucher(
    { voucherId = null, voucherCode = null, userId = null },
    orderAmount,
  ) {
    if (!voucherId && !voucherCode) {
      return { voucher: null, voucherDiscount: 0, assignedVoucher: null };
    }

    let voucher = null;

    if (voucherId) {
      voucher = await Voucher.findById(voucherId);
    } else if (voucherCode) {
      voucher = await Voucher.findOne({
        code: String(voucherCode).trim().toUpperCase(),
      });
    }

    const now = new Date();
    if (
      voucher?.isActive &&
      voucher?.expiryDate &&
      new Date(voucher.expiryDate) < now
    ) {
      await Promise.all([
        Voucher.updateOne(
          { _id: voucher._id, isActive: true },
          { $set: { isActive: false } },
        ),
        UserVoucher.updateMany(
          { voucher: voucher._id, status: { $ne: "EXPIRED" } },
          { $set: { status: "EXPIRED" } },
        ),
      ]);
      voucher.isActive = false;
    }

    this.validateVoucherEligibility(voucher, orderAmount);

    let assignedVoucher = null;
    if (voucher.audienceType === "ASSIGNED") {
      assignedVoucher = await UserVoucher.findOne({
        user: userId,
        voucher: voucher._id,
      });
      this.validateUserVoucherEligibility(assignedVoucher);
    }

    const voucherDiscount = this.calculateVoucherDiscount(voucher, orderAmount);

    return { voucher, voucherDiscount, assignedVoucher };
  }

  async validateVoucherForCheckout(userId, voucherCode) {
    if (!voucherCode || !String(voucherCode).trim()) {
      throw ApiError.badRequest("Voucher code is required");
    }

    const { validItems } = await this.validateCartForCheckout(userId);

    const subtotal = validItems.reduce((sum, item) => {
      return sum + item.book.price * item.quantity;
    }, 0);

    const shippingFee = this.calculateShippingFee(subtotal);
    const orderAmount = subtotal + shippingFee;

    const { voucher, voucherDiscount } = await this.resolveVoucher(
      { voucherCode, userId },
      orderAmount,
    );

    const totals = this.calculateOrderTotals(
      validItems,
      voucherDiscount,
      shippingFee,
    );

    return {
      voucher: {
        _id: voucher._id,
        code: voucher.code,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
        maxDiscountValue: voucher.maxDiscountValue,
      },
      totals,
    };
  }

  // Create order
  async createOrder(userId, orderData) {
    const {
      paymentMethod = "COD",
      shippingAddressId = null,
      voucherId = null,
      voucherCode = null,
      useCoin = false,
      notes = "",
      ipAddress = "127.0.0.1",
    } = orderData;

    // Resolve shipping address from user's saved addresses
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound("User not found");

    let resolvedAddress = null;
    if (shippingAddressId) {
      resolvedAddress = user.addresses.id(shippingAddressId);
      if (!resolvedAddress)
        throw ApiError.badRequest("Shipping address not found");
    } else {
      // Fall back to default address
      resolvedAddress =
        user.addresses.find((a) => a.isDefault) || user.addresses[0];
    }

    if (!resolvedAddress) {
      throw ApiError.badRequest(
        "Please add a shipping address before placing an order",
      );
    }

    const shippingAddressSnapshot = {
      addressId: resolvedAddress._id.toString(),
      fullName: resolvedAddress.fullName,
      phone: resolvedAddress.phone,
      province: resolvedAddress.province,
      district: resolvedAddress.district,
      commune: resolvedAddress.commune,
      description: resolvedAddress.description,
    };

    // Validate cart
    const { cart, validItems } = await this.validateCartForCheckout(userId);

    const hasEbookInCart = validItems.some((item) => item.book?.isEbook);
    if (hasEbookInCart && paymentMethod !== "VNPAY") {
      throw ApiError.badRequest(
        "E-book orders only support online payment via VNPay",
      );
    }

    // Validate payment method
    const paymentProvider = paymentService.getProvider(paymentMethod);
    const canPay = await paymentProvider.canPay();
    if (!canPay) {
      throw ApiError.badRequest(
        `Payment method ${paymentMethod} is not available`,
      );
    }

    // Calculate subtotal first
    const subtotal = validItems.reduce((sum, item) => {
      return sum + item.book.price * item.quantity;
    }, 0);

    // Calculate shipping fee based on subtotal (free if > 200,000 VND)
    const shippingFee = this.calculateShippingFee(subtotal);

    const orderAmount = subtotal + shippingFee;

    const { voucher, voucherDiscount, assignedVoucher } =
      await this.resolveVoucher(
        { voucherId, voucherCode, userId },
        orderAmount,
      );

    // Calculate coin discount if user wants to use coins
    let coinsToUse = 0;
    if (useCoin) {
      const orderAmountAfterVoucher = orderAmount - voucherDiscount;
      coinsToUse = coinService.calculateMaxCoinsUsable(
        user.coinBalance,
        orderAmountAfterVoucher,
      );
      console.log("💰 [OrderService] Coin usage:", {
        userBalance: user.coinBalance,
        orderAmountAfterVoucher,
        coinsToUse,
      });
    }

    const totals = this.calculateOrderTotals(
      validItems,
      voucherDiscount,
      shippingFee,
      coinsToUse,
    );

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

    const duplicateOrder = await this.findRecentDuplicateOrder(
      userId,
      orderItems,
      totals.total,
    );
    if (duplicateOrder) {
      throw ApiError.conflict(
        `A similar order was just created (${duplicateOrder.orderNumber}). Please refresh and check your order history.`,
      );
    }

    // Create payment
    console.log(
      "💳 [OrderService] Creating payment with provider:",
      paymentMethod,
    );
    console.log("💰 [OrderService] Payment details:", {
      orderNumber,
      total: totals.total,
      ipAddress,
    });

    const paymentResult = await paymentProvider.createPayment({
      orderNumber,
      total: totals.total,
      ipAddress,
    });

    console.log("✅ [OrderService] Payment created:", {
      paymentMethod: paymentResult.paymentMethod,
      paymentStatus: paymentResult.paymentStatus,
      hasQrCode: !!paymentResult.qrCodeUrl,
    });

    let order = null;
    let coinsDeducted = 0;
    let stockReservations = [];

    try {
      stockReservations = await this.reserveStockForOrderItems(orderItems);

      // Create order in database
      console.log("📝 [OrderService] Creating order in database...");
      order = await Order.create({
        orderNumber,
        user: userId,
        items: orderItems,
        subtotal: totals.subtotal,
        discount: totals.discount,
        coinsUsed: coinsToUse,
        shippingFee: totals.shippingFee,
        total: totals.total,
        paymentMethod,
        paymentStatus: paymentResult.paymentStatus,
        orderStatus: "PENDING",
        shippingAddress: shippingAddressSnapshot,
        voucher: voucher?._id || null,
        notes,
        transactionId: paymentResult.transactionId || null,
      });

      // Deduct coins from user if coins were used
      if (coinsToUse > 0) {
        await coinService.deductCoins(
          userId,
          coinsToUse,
          order._id,
          `Used ${coinsToUse} coins for order ${orderNumber}`,
        );
        coinsDeducted = coinsToUse;
        console.log("💸 [OrderService] Deducted coins:", {
          coinsToUse,
          orderId: order._id,
        });
      }

      // Clear cart only after successful order creation
      await Cart.findByIdAndUpdate(cart._id, { items: [] });

      // Populate order details
      await order.populate("items.book user");

      if (assignedVoucher?._id) {
        await this.consumeAssignedVoucherUsage(assignedVoucher._id);
      }
    } catch (error) {
      await this.rollbackOrderCreation({
        order,
        userId,
        coinsDeducted,
        stockReservations,
      });
      throw error;
    }

    console.log("🎉 [OrderService] Order created successfully:", {
      orderNumber: order.orderNumber,
      orderId: order._id,
      total: order.total,
      paymentMethod: order.paymentMethod,
    });
    // 🔥 AUTO ASSIGN SHIPPER
    try {
      console.log("🚚 Auto assigning shipper...");
      await this.autoAssignShipper(order._id);
    } catch (err) {
      console.log("⚠ Auto assign failed:", err.message);
    }
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
  async getAllOrders({
    page = 1,
    limit = 10,
    status,
    paymentStatus,
    search,
    userId,
    fromDate,
    toDate,
  } = {}) {
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

    if (fromDate || toDate) {
      filter.createdAt = {};

      if (fromDate) {
        filter.createdAt.$gte = this.normalizeDateBoundary(fromDate);
      }

      if (toDate) {
        filter.createdAt.$lte = this.normalizeDateBoundary(toDate, true);
      }

      if (
        filter.createdAt.$gte &&
        filter.createdAt.$lte &&
        filter.createdAt.$gte > filter.createdAt.$lte
      ) {
        throw ApiError.badRequest(
          "fromDate must be earlier than or equal to toDate",
        );
      }
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
        .populate("shipper", "email firstName lastName")
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
      .populate("shipper", "email firstName lastName")
      .lean();

    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    return order;
  }

  // Admin: update order status
  async updateOrderStatus(orderId, status) {
    const allowedStatuses = ["PROCESSING", "SHIPPED"];

    if (!allowedStatuses.includes(status)) {
      throw ApiError.badRequest(
        "Admin can only update order status to PROCESSING or SHIPPED",
      );
    }

    const order = await Order.findById(orderId);
    if (!order) throw ApiError.notFound("Order not found");

    this.validateAdminStatusTransition(order.orderStatus, status);

    if (status === "SHIPPED" && !order.shipper) {
      throw ApiError.badRequest(
        "A shipper must be assigned before marking order as SHIPPED",
      );
    }

    order.orderStatus = status;

    await order.save();
    await order.populate("items.book user shipper");

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

  async reorderOrder(orderId, userId, options = {}) {
    const {
      paymentMethod = null,
      notes = "",
      ipAddress = "127.0.0.1",
    } = options;

    const previousOrder = await Order.findById(orderId).lean();
    if (!previousOrder) {
      throw ApiError.notFound("Order not found");
    }

    if (previousOrder.user.toString() !== userId.toString()) {
      throw ApiError.forbidden("You are not authorized to reorder this order");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound("User not found");
    }

    const previousAddressId = previousOrder.shippingAddress?.addressId;
    const preferredAddress = previousAddressId
      ? user.addresses.id(previousAddressId)
      : null;
    const fallbackAddress =
      user.addresses.find((address) => address.isDefault) || user.addresses[0];
    const selectedAddress = preferredAddress || fallbackAddress;

    if (!selectedAddress) {
      throw ApiError.badRequest(
        "Please add a shipping address before reordering",
      );
    }

    const shippingAddressSnapshot = {
      addressId: selectedAddress._id.toString(),
      fullName: selectedAddress.fullName,
      phone: selectedAddress.phone,
      province: selectedAddress.province,
      district: selectedAddress.district,
      commune: selectedAddress.commune,
      description: selectedAddress.description,
    };

    const paymentMethodToUse =
      paymentMethod || previousOrder.paymentMethod || "COD";

    const requestedBookIds = previousOrder.items
      .map((item) => item.book?.toString())
      .filter(Boolean);

    const books = await Book.find({ _id: { $in: requestedBookIds } });
    const booksById = new Map(books.map((book) => [book._id.toString(), book]));

    const hasEbookInOrder = books.some((book) => book.isEbook);
    if (hasEbookInOrder && paymentMethodToUse !== "VNPAY") {
      throw ApiError.badRequest(
        "E-book orders only support online payment via VNPay",
      );
    }

    const paymentProvider = paymentService.getProvider(paymentMethodToUse);
    const canPay = await paymentProvider.canPay();
    if (!canPay) {
      throw ApiError.badRequest(
        `Payment method ${paymentMethodToUse} is not available`,
      );
    }

    const validationErrors = [];
    const orderItems = [];

    for (const item of previousOrder.items) {
      const bookId = item.book?.toString();
      const book = bookId ? booksById.get(bookId) : null;

      if (!book) {
        validationErrors.push({
          message: `Book \"${item.title}\" is no longer available`,
        });
        continue;
      }

      if (book.stock < item.quantity) {
        validationErrors.push({
          message: `Not enough stock for \"${book.title}\". Available: ${book.stock}`,
        });
        continue;
      }

      orderItems.push({
        book: book._id,
        title: book.title,
        author: book.author,
        price: book.price,
        quantity: item.quantity,
        subtotal: Math.round(book.price * item.quantity * 100) / 100,
      });
    }

    if (validationErrors.length > 0) {
      throw ApiError.badRequest("Reorder cannot be completed", {
        errors: validationErrors,
      });
    }

    const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
    const shippingFee = this.calculateShippingFee(subtotal);
    const total = Math.max(0, subtotal + shippingFee);
    const orderNumber = this.generateOrderNumber();

    const duplicateOrder = await this.findRecentDuplicateOrder(
      userId,
      orderItems,
      total,
    );
    if (duplicateOrder) {
      throw ApiError.conflict(
        `A similar order was just created (${duplicateOrder.orderNumber}). Please refresh and check your order history.`,
      );
    }

    let stockReservations = [];
    let order = null;
    let paymentResult = null;

    try {
      stockReservations = await this.reserveStockForOrderItems(orderItems);

      paymentResult = await paymentProvider.createPayment({
        orderNumber,
        total,
        ipAddress,
      });

      order = await Order.create({
        orderNumber,
        user: userId,
        items: orderItems,
        subtotal,
        discount: 0,
        coinsUsed: 0,
        shippingFee,
        total,
        paymentMethod: paymentMethodToUse,
        paymentStatus: paymentResult.paymentStatus,
        orderStatus: "PENDING",
        shippingAddress: shippingAddressSnapshot,
        notes,
        transactionId: paymentResult.transactionId || null,
      });

      await order.populate("items.book user");

      return {
        order,
        payment: paymentResult,
      };
    } catch (error) {
      await this.rollbackOrderCreation({
        order,
        userId,
        stockReservations,
      });
      throw error;
    }
  }

  async getInvoiceHtml(orderId, userId) {
    const order = await Order.findById(orderId)
      .populate("user", "email firstName lastName")
      .lean();

    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    if (order.user?._id?.toString() !== userId.toString()) {
      throw ApiError.forbidden("You are not authorized to view this invoice");
    }

    if (order.orderStatus !== "DELIVERED") {
      throw ApiError.badRequest(
        "Invoice is available only for delivered orders",
      );
    }

    return {
      html: this.buildInvoiceHtml(order),
      fileName: `invoice-${order.orderNumber}.html`,
      orderNumber: order.orderNumber,
    };
  }

  async submitReturnRefundRequest(orderId, userId, payload = {}) {
    const { type = "REFUND", reason = "", details = "" } = payload;
    const normalizedType = String(type || "")
      .trim()
      .toUpperCase();
    const normalizedReason = String(reason || "").trim();
    const normalizedDetails = String(details || "").trim();

    if (!["RETURN", "REFUND"].includes(normalizedType)) {
      throw ApiError.badRequest("Request type must be RETURN or REFUND");
    }

    if (!normalizedReason) {
      throw ApiError.badRequest("Reason is required");
    }

    const order = await Order.findById(orderId);
    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    if (order.user.toString() !== userId.toString()) {
      throw ApiError.forbidden(
        "You are not authorized to request return/refund for this order",
      );
    }

    if (order.orderStatus !== "DELIVERED") {
      throw ApiError.badRequest(
        "Return/refund is available only for delivered orders",
      );
    }

    const windowInfo = this.getReturnRequestWindowInfo(order);
    if (!windowInfo.allowed) {
      throw ApiError.badRequest(
        `Return/refund period has expired. Requests are allowed within ${RETURN_REQUEST_WINDOW_DAYS} days after delivery`,
      );
    }

    if (order.returnRequest?.requestedAt) {
      throw ApiError.badRequest(
        "Return/refund request has already been submitted for this order",
      );
    }

    order.returnRequest = {
      type: normalizedType,
      reason: normalizedReason,
      details: normalizedDetails,
      status: "PENDING",
      requestedAt: new Date(),
      reviewedAt: null,
      adminNote: "",
    };

    await order.save();

    return order;
  }

  async reviewReturnRefundRequest(orderId, payload = {}) {
    const { status, adminNote = "" } = payload;
    const nextStatus = String(status || "")
      .trim()
      .toUpperCase();
    const allowedStatuses = ["APPROVED", "REJECTED", "COMPLETED"];

    if (!allowedStatuses.includes(nextStatus)) {
      throw ApiError.badRequest(
        "Status must be APPROVED, REJECTED or COMPLETED",
      );
    }

    const order = await Order.findById(orderId).populate(
      "user",
      "email firstName lastName",
    );
    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    if (!order.returnRequest?.requestedAt) {
      throw ApiError.badRequest("This order has no return/refund request");
    }

    const currentStatus = order.returnRequest.status || "PENDING";

    if (["REJECTED", "COMPLETED"].includes(currentStatus)) {
      throw ApiError.badRequest(
        `Request is already ${currentStatus.toLowerCase()}`,
      );
    }

    if (currentStatus === "PENDING" && nextStatus === "COMPLETED") {
      throw ApiError.badRequest(
        "Request must be approved before marking as completed",
      );
    }

    if (currentStatus === nextStatus) {
      throw ApiError.badRequest(
        `Request is already ${nextStatus.toLowerCase()}`,
      );
    }

    order.returnRequest.status = nextStatus;
    order.returnRequest.reviewedAt = new Date();
    order.returnRequest.adminNote = String(adminNote || "").trim();

    // Mark payment as refunded when refund flow is fully completed by admin.
    if (nextStatus === "COMPLETED" && order.returnRequest.type === "REFUND") {
      order.paymentStatus = "REFUNDED";
    }

    await order.save();
    await order.populate("items.book");

    return order;
  }

  async getRecentCustomerRequestHistory(limit = 8) {
    const safeLimit = Math.max(1, Math.min(Number(limit) || 8, 50));

    const orders = await Order.find({
      "returnRequest.requestedAt": { $ne: null },
    })
      .populate("user", "email firstName lastName")
      .sort({ "returnRequest.requestedAt": -1, createdAt: -1 })
      .limit(safeLimit)
      .lean();

    const requests = orders.map((order) => {
      const fullName = [order.user?.firstName, order.user?.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();

      return {
        orderId: order._id,
        orderNumber: order.orderNumber,
        customer: {
          _id: order.user?._id || null,
          email: order.user?.email || "",
          fullName,
        },
        request: {
          type: order.returnRequest?.type || "",
          reason: order.returnRequest?.reason || "",
          details: order.returnRequest?.details || "",
          status: order.returnRequest?.status || "PENDING",
          requestedAt: order.returnRequest?.requestedAt || null,
          reviewedAt: order.returnRequest?.reviewedAt || null,
          adminNote: order.returnRequest?.adminNote || "",
        },
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        total: order.total,
      };
    });

    return { requests };
  }

  // Confirm payment (for VNPay callback)
  async confirmPayment(callbackParams) {
    // Extract order number from VNPay's vnp_TxnRef
    const orderNumber = callbackParams.vnp_TxnRef;

    if (!orderNumber) {
      throw ApiError.badRequest(
        "Invalid payment callback: Order number not found",
      );
    }

    const order = await Order.findOne({ orderNumber });

    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    if (order.paymentStatus === "PAID") {
      return {
        order,
        payment: {
          success: true,
          paymentStatus: "PAID",
          message: "Payment already confirmed",
        },
      };
    }

    // Get payment provider and verify the callback
    const paymentProvider = paymentService.getProvider(order.paymentMethod);
    const confirmResult = await paymentProvider.confirmPayment(callbackParams);

    // Update order payment status
    order.paymentStatus = confirmResult.paymentStatus;

    if (confirmResult.success) {
      order.transactionId = confirmResult.transactionId || order.transactionId;
      order.paidAt = new Date();
    } else {
      order.paymentStatus = "FAILED";
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

  async getRevenue(range) {
    // Thống kê doanh thu, nếu range = "month" thì thống kê doanh thu trong tháng hiện tại, ngược lại thống kê toàn bộ
    const filter = { orderStatus: "DELIVERED" }; // Chỉ tính doanh thu từ những đơn hàng đã được giao thành công

    const now = new Date(); // Lấy ngày hiện tại để xác định khoảng thời gian thống kê

    if (range === "month") {
      // Nếu range là "month", chỉ thống kê doanh thu từ đầu tháng đến hiện tại
      filter.deliveredAt = {
        // Chỉ tính những đơn hàng được giao trong tháng hiện tại
        $gte: new Date(now.getFullYear(), now.getMonth(), 1), // Ngày đầu tiên của tháng hiện tại
      };
    }

    const orders = await Order.find(filter); // Lấy tất cả đơn hàng đã được giao thành công (và nếu range là "month" thì chỉ lấy những đơn hàng được giao trong tháng hiện tại)

    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0); // Tính tổng doanh thu bằng cách cộng tổng tiền của tất cả đơn hàng đã được giao thành công (đã lọc theo khoảng thời gian nếu range là "month")

    // 👇 group theo ngày
    const chartMap = {}; // Tạo một object để nhóm doanh thu theo ngày, key là ngày (yyyy-mm-dd) và value là tổng doanh thu của ngày đó

    orders.forEach((order) => {
      const day = order.deliveredAt.toISOString().slice(0, 10); // yyyy-mm-dd
      chartMap[day] = (chartMap[day] || 0) + order.total; // Cộng dồn doanh thu của đơn hàng vào ngày tương ứng trong chartMap
    });

    const chartData = Object.keys(chartMap).map((day) => ({
      // Chuyển đổi chartMap thành mảng để dễ sử dụng cho biểu đồ, mỗi phần tử có dạng { date: "yyyy-mm-dd", revenue: tổng doanh thu của ngày đó }
      date: day, // Ngày (yyyy-mm-dd)
      revenue: chartMap[day], // Tổng doanh thu của ngày đó
    }));

    return {
      // Trả về tổng doanh thu, số lượng đơn hàng đã giao thành công và dữ liệu để vẽ biểu đồ doanh thu theo ngày
      totalRevenue,
      totalOrders: orders.length,
      chartData,
    };
  }

  async getOrderById(orderId, userId = null) {
    const order = await Order.findById(orderId)
      .populate("user", "email firstName lastName")
      .populate("shipper", "email firstName lastName")
      .populate("items.book");

    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    if (userId && order.user?._id?.toString() !== userId.toString()) {
      throw ApiError.forbidden("You are not authorized to view this order");
    }

    return order;
  }

  async assignShipper(orderId, shipperId) {
    // Lấy orderId và shipperId từ tham số hàm
    const shipper = await User.findById(shipperId); // Tìm shipper trong database
    if (!shipper || shipper.role?.toLowerCase() !== "shipper") {
      // Kiểm tra nếu không tìm thấy hoặc không phải là shipper
      throw ApiError.badRequest("Invalid shipper"); // Trả về lỗi nếu shipper không hợp lệ
    }

    const order = await Order.findById(orderId); // Tìm order trong database
    if (!order) {
      // Kiểm tra nếu không tìm thấy order
      throw ApiError.notFound("Order not found"); // Trả về lỗi nếu không tìm thấy order
    }

    if (!["PENDING", "PROCESSING", "SHIPPED"].includes(order.orderStatus)) {
      throw ApiError.badRequest(
        "Order can only be assigned while in PENDING or PROCESSING status"
      );
    }

    // ⭐ THÊM ĐOẠN NÀY
    const { province, district } = order.shippingAddress || {};

    const matchAddress = shipper.addresses?.some(
      (addr) =>
        addr.province?.trim() === province?.trim() &&
        addr.district?.trim() === district?.trim(),
    );
    if (!matchAddress) {
      throw ApiError.badRequest("Shipper does not serve this area");
    }
    if (order.shipper) {
      throw ApiError.badRequest("Order already assigned to a shipper");
    }

    order.shipper = shipperId;
    order.assignedAt = new Date();

    if (order.orderStatus === "PROCESSING") {
      order.orderStatus = "PROCESSING";
    }

    order.assignmentStatus = "PENDING";
    // ===== ADD ASSIGNMENT HISTORY =====
    if (!order.assignmentHistory) {
      order.assignmentHistory = [];
    }

    order.assignmentHistory.push({
      shipper: shipperId,
      assignedAt: new Date(),
      status: "PENDING",
    });
    await order.save(); // Lưu order sau khi gán shipper
    await User.findByIdAndUpdate(shipper._id, {
      $inc: { currentOrders: 1 },
    });
    await order.populate("shipper", "email firstName lastName");

    return order;
  }
  // Lấy số lượng đơn hàng đang được giao (SHIPPED hoặc PROCESSING) của shipper để kiểm tra giới hạn 20 đơn hàng
  async getActiveOrderCount(shipperId) {
    return await Order.countDocuments({
      shipper: shipperId,
      orderStatus: { $in: ["SHIPPED", "PROCESSING"] },
    });
  }
  // Tự động gán shipper cho đơn hàng dựa trên địa chỉ giao hàng và khu vực phục vụ của shipper

  async autoAssignShipper(orderId) {
    const order = await Order.findById(orderId);

    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    if (order.shipper) {
      throw ApiError.badRequest("Order already assigned");
    }

    const allowedStatuses = ["PENDING", "PROCESSING"];

    if (!allowedStatuses.includes(order.orderStatus)) {
      throw ApiError.badRequest(
        "Auto assign only works for PENDING or PROCESSING orders"
      );
    }
    const { province, district } = order.shippingAddress || {};

    if (!province || !district) {
      throw ApiError.badRequest("Shipping address incomplete");
    }

    console.log("🔍 Looking for shipper:", province, district);

    const shipper = await User.findOne({
      role: ROLES.SHIPPER,
      isActive: true,
      currentOrders: { $lt: MAX_ORDERS },
      _id: { $nin: order.rejectedShippers || [] },
      addresses: {
        $elemMatch: {
          province: province.trim(),
          district: district.trim(),
        },
      },
    }).sort({ currentOrders: 1 });

    // ❌ Nếu không có shipper → KHÔNG throw
    if (!shipper) {
      console.log("❌ No available shipper found");
      await order.save();

      return order;
    }

    // ✅ Assign shipper
    order.shipper = shipper._id;
    order.assignedAt = new Date();
    order.orderStatus = "SHIPPED";
    order.assignmentStatus = "PENDING";
    if (!order.assignmentHistory) {
      order.assignmentHistory = [];
    }

    order.assignmentHistory.push({
      shipper: shipper._id,
      assignedAt: new Date(),
      status: "PENDING",
    });
    await order.save();

    // tăng số đơn hiện tại
    await User.findByIdAndUpdate(shipper._id, {
      $inc: { currentOrders: 1 },
    });
    await order.populate("shipper", "email firstName lastName");

    console.log("✅ Assigned to shipper:", shipper.email);

    return order;
  }

  async respondAssignment(orderId, shipperId, action) {
    const order = await Order.findById(orderId);

    if (!order) throw ApiError.notFound("Order not found");

    // ✅ Kiểm tra đúng shipper
    if (!order.shipper || order.shipper.toString() !== shipperId.toString()) {
      throw ApiError.forbidden("Not your assignment");
    }

    if (order.assignmentStatus !== "PENDING") {
      throw ApiError.badRequest("Assignment already responded");
    }

    // ================= ACCEPT =================
    if (action === "ACCEPT") {
      order.assignmentStatus = "ACCEPTED";
      const lastAssignment =
        order.assignmentHistory[order.assignmentHistory.length - 1];

      if (lastAssignment) {
        lastAssignment.status = "ACCEPTED";
        lastAssignment.respondedAt = new Date();
      }
      // ❌ KHÔNG đổi orderStatus nữa
      // order.orderStatus = "PROCESSING";

      await order.save();

      return { message: "Order accepted successfully" };
    }
    // ================= REJECT =================
    if (action === "REJECT") {
      // 1️⃣ Thêm shipper vào danh sách đã reject
      if (!order.rejectedShippers) {
        order.rejectedShippers = [];
      }

      if (!order.rejectedShippers.includes(shipperId)) {
        order.rejectedShippers.push(shipperId);
      }

      // ===== UPDATE LAST HISTORY CỦA ĐÚNG SHIPPER =====
      const lastAssignment = [...order.assignmentHistory]
        .reverse()
        .find(
          (a) =>
            a.shipper.toString() === shipperId.toString() &&
            a.status === "PENDING",
        );

      if (lastAssignment) {
        lastAssignment.status = "REJECTED";
        lastAssignment.respondedAt = new Date();
      }
      // ⚡ BẮT BUỘC MARK MODIFIED
      order.markModified("assignmentHistory");

      // 💥 SAVE NGAY SAU KHI REJECT
      await order.save();
      // 2️⃣ Trừ currentOrders
      await User.findByIdAndUpdate(shipperId, {
        $inc: { currentOrders: -1 },
      });

      const { province, district } = order.shippingAddress;

      // 3️⃣ Tìm shipper KHÔNG nằm trong rejectedShippers
      const newShipper = await User.findOne({
        role: ROLES.SHIPPER,
        isActive: true,
        currentOrders: { $lt: MAX_ORDERS },
        _id: { $nin: order.rejectedShippers || [] }, // 🔥 CHỖ QUAN TRỌNG
        addresses: {
          $elemMatch: {
            province: province.trim(),
            district: district.trim(),
          },
        },
      }).sort({ currentOrders: 1 });

      if (!newShipper) {
        console.log("⚠ All shippers rejected. Resetting order...");

        order.shipper = null;
        order.orderStatus = "SHIPPED";
        order.assignmentStatus = null;
        order.assignedAt = null;

        await order.save();

        return order;
      }

      const nextShipper = newShipper;

      order.shipper = nextShipper._id;
      order.assignmentStatus = "PENDING";
      order.orderStatus = "SHIPPED";
      order.assignedAt = new Date();
      // ===== PUSH NEW HISTORY =====
      if (!order.assignmentHistory) {
        order.assignmentHistory = [];
      }

      order.assignmentHistory.push({
        shipper: nextShipper._id,
        assignedAt: new Date(),
        status: "PENDING",
      });
      if (order.assignmentHistory?.length > 0) {
        const last =
          order.assignmentHistory[order.assignmentHistory.length - 1];
        order.assignmentStatus = last.status;
      }
      await order.save();

      await User.findByIdAndUpdate(nextShipper._id, {
        $inc: { currentOrders: 1 },
      });

      return order;
    }

    throw ApiError.badRequest("Invalid action");
  }
  // Lấy hiệu suất làm việc của shipper dựa trên lịch sử phân công (tỷ lệ chấp nhận, từ chối, giao thành công)
  async getShipperPerformance(shipperId) {
    const orders = await Order.find({
      "assignmentHistory.shipper": shipperId,
    });

    let totalAssigned = 0;
    let accepted = 0;
    let rejected = 0;
    let delivered = 0;
    let cancelled = 0;
    for (const order of orders) {
      // Lấy tất cả history của shipper này trong order
      const histories = order.assignmentHistory.filter(
        (h) => h.shipper.toString() === shipperId.toString(),
      );

      // Nếu shipper từng được assign order này → chỉ +1 lần
      if (histories.length > 0) {
        totalAssigned++;
      }

      // Kiểm tra shipper đã từng ACCEPT order này chưa
      const acceptedHistory = histories.find((h) => h.status === "ACCEPTED");

      // Kiểm tra shipper đã từng REJECT order này chưa
      const rejectedHistory = histories.find((h) => h.status === "REJECTED");

      if (acceptedHistory) {
        accepted++;

        // 🔥 Chỉ tính delivered nếu:
        // 1. Order đã DELIVERED
        // 2. Shipper hiện tại chính là shipper này
        if (
          order.orderStatus === "DELIVERED" &&
          order.shipper?.toString() === shipperId.toString()
        ) {
          delivered++;
        }
        if (
          order.orderStatus === "CANCELLED" &&
          order.shipper?.toString() === shipperId.toString()
        ) {
          cancelled++;
        }
      }

      if (rejectedHistory) {
        rejected++;
      }
    }

    // 📊 Acceptance Rate
    const acceptanceRate =
      accepted + rejected > 0
        ? ((accepted / (accepted + rejected)) * 100).toFixed(1)
        : 0;

    // 📊 Success Rate (chuẩn thực tế)
    const successRate =
      delivered + cancelled > 0
        ? ((delivered / (delivered + cancelled)) * 100).toFixed(1)
        : 0;

    return {
      totalAssigned,
      accepted,
      rejected,
      delivered,
      cancelled,
      acceptanceRate,
      successRate,
    };
  }
  // Lấy lịch sử phân công của shipper, bao gồm tất cả đơn hàng từng được phân công (dù đã accept hay reject), trạng thái phân công và thông tin đơn hàng
  async getAssignmentHistory(shipperId) {
    const orders = await Order.find({
      "assignmentHistory.shipper": shipperId,
    })
      .populate("items.book")
      .populate("user", "email firstName lastName")
      .sort({ createdAt: -1 })
      .lean();

    return {
      orders,
    };
  }
}

export default new OrderService();
