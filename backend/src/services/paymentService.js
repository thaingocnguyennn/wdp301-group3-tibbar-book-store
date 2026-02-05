import crypto from "crypto";

// Payment provider interface - all providers must implement these methods
class PaymentProvider {
  constructor(method) {
    this.method = method;
  }

  async canPay() {
    throw new Error("canPay() must be implemented");
  }

  async createPayment(orderData) {
    throw new Error("createPayment() must be implemented");
  }

  async confirmPayment(callbackParams) {
    throw new Error("confirmPayment() must be implemented");
  }
}

// COD Payment Provider - Cash on Delivery
class CODPaymentProvider extends PaymentProvider {
  constructor() {
    super("COD");
  }

  async canPay() {
    return true; // COD is always available
  }

  async createPayment(orderData) {
    // COD doesn't need external payment processing
    // Just return the order data with payment status PENDING
    return {
      success: true,
      paymentMethod: "COD",
      paymentStatus: "PENDING",
      orderData,
    };
  }

  async confirmPayment(callbackParams) {
    // COD doesn't have confirmation callback
    return {
      success: true,
      paymentStatus: "PENDING",
    };
  }
}

// VietQR Payment Provider
class VietQRPaymentProvider extends PaymentProvider {
  constructor() {
    super("VIETQR");
    // Bank account information
    this.bankId = "mb"; // MBbank code
    this.accountNo = process.env.VIETQR_ACCOUNT_NO || "0346288374";
    this.accountName = process.env.VIETQR_ACCOUNT_NAME || "TRAN VAN MINH PHUNG";
    this.template = "compact2"; // QR template type
    this.branch = process.env.VIETQR_BRANCH || "MBBank";
  }

  async canPay() {
    // VietQR is always available if bank info is configured
    return !!(this.accountNo && this.accountName);
  }

  async createPayment(orderData) {
    console.log("🐳 [VietQR] Creating payment...", orderData);
    
    if (!await this.canPay()) {
      throw new Error("VietQR is not configured. Please set bank account information in .env file.");
    }

    const { orderNumber, total } = orderData;
    
    // SECURITY: Verify total is provided and valid
    if (!total || total <= 0) {
      throw new Error("Invalid payment amount");
    }
    
    // Generate transfer content with ORDER reference for reconciliation
    const description = `ORDER ${orderNumber}`;
    const amount = Math.round(total); // Amount in VND

    console.log("💵 [VietQR] Payment info:", {
      orderNumber,
      description,
      amount,
      bankId: this.bankId
    });

    // Generate VietQR URL using api.vietqr.io
    const qrContent = `https://img.vietqr.io/image/${this.bankId}-${this.accountNo}-${this.template}.png?amount=${amount}&addInfo=${encodeURIComponent(description)}&accountName=${encodeURIComponent(this.accountName)}`;

    return {
      success: true,
      paymentMethod: "VIETQR",
      paymentStatus: "PENDING",
      qrCodeUrl: qrContent,
      bankInfo: {
        bankId: "MBBank",
        bankName: "Ngân hàng Quân đội (MBBank)",
        accountNo: this.accountNo,
        accountName: this.accountName,
        branch: this.branch,
      },
      amount: amount,
      description: description,
      orderData,
    };
  }

  async confirmPayment(callbackParams) {
    // VietQR doesn't have automatic confirmation callback
    // Payment confirmation needs to be done manually by admin
    return {
      success: true,
      paymentStatus: "PENDING",
      message: "VietQR payment is pending confirmation",
    };
  }
}

// Payment Service - Factory for payment providers
class PaymentService {
  constructor() {
    this.providers = {
      COD: new CODPaymentProvider(),
      VIETQR: new VietQRPaymentProvider(),
    };
  }

  getProvider(method) {
    const provider = this.providers[method];
    if (!provider) {
      throw new Error(`Payment method ${method} is not supported`);
    }
    return provider;
  }

  async getAvailablePaymentMethods() {
    const methods = [];
    for (const [method, provider] of Object.entries(this.providers)) {
      const available = await provider.canPay();
      methods.push({
        method,
        available,
        name: this.getPaymentMethodName(method),
        description: this.getPaymentMethodDescription(method),
      });
    }
    return methods;
  }

  getPaymentMethodName(method) {
    const names = {
      COD: "Cash on Delivery",
      VIETQR: "VietQR Online Payment",
    };
    return names[method] || method;
  }

  getPaymentMethodDescription(method) {
    const descriptions = {
      COD: "Pay with cash when you receive your order",
      VIETQR: "Scan QR code to pay via banking app",
    };
    return descriptions[method] || "";
  }
}

export default new PaymentService();
