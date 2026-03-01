import { VNPay, ProductCode, VnpLocale, HashAlgorithm, ignoreLogger } from "vnpay";

// VNPay response code to English message mapping
const VNPAY_RESPONSE_MESSAGES = {
  "00": "Transaction successful",
  "07": "Transaction suspected of fraud",
  "09": "Card/account not registered for internet banking",
  "10": "Card/account authentication failed more than allowed times",
  "11": "Payment session expired",
  "12": "Card/account is locked",
  "13": "Invalid transaction authentication password",
  "24": "Transaction cancelled by customer",
  "51": "Insufficient account balance",
  "65": "Account has exceeded daily transaction limit",
  "75": "Payment bank is under maintenance",
  "79": "Invalid payment password entered too many times",
  "99": "An unknown error occurred",
};

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
    return {
      success: true,
      paymentMethod: "COD",
      paymentStatus: "PENDING",
      orderData,
    };
  }

  async confirmPayment(callbackParams) {
    return {
      success: true,
      paymentStatus: "PENDING",
    };
  }
}

// VNPay Payment Provider - Online payment via VNPay gateway
class VNPayPaymentProvider extends PaymentProvider {
  constructor() {
    super("VNPAY");

    this.tmnCode = process.env.VNP_TMN_CODE || "PKE9F59W";
    this.secureSecret = process.env.VNP_HASH_SECRET || "RHW3KOPLCCGKU512ECR16J18VAK38QUF";
    this.returnUrl = process.env.VNP_RETURN_URL || "http://localhost:5173/checkout/payment-return";

    this.vnpay = new VNPay({
      tmnCode: this.tmnCode,
      secureSecret: this.secureSecret,
      vnpayHost: "https://sandbox.vnpayment.vn",
      testMode: true,
      hashAlgorithm: HashAlgorithm.SHA512,
      enableLog: true,
      loggerFn: ignoreLogger,
    });
  }

  async canPay() {
    return !!(this.tmnCode && this.secureSecret);
  }

  async createPayment(orderData) {
    const { orderNumber, total, ipAddress } = orderData;

    if (!total || total <= 0) {
      throw new Error("Invalid payment amount");
    }

    console.log("💳 [VNPay] Creating payment URL...", {
      orderNumber,
      total,
      ipAddress,
    });

    const paymentUrl = this.vnpay.buildPaymentUrl({
      vnp_Amount: total,
      vnp_IpAddr: ipAddress || "127.0.0.1",
      vnp_TxnRef: orderNumber,
      vnp_OrderInfo: `Thanh toan don hang ${orderNumber}`,
      vnp_ReturnUrl: this.returnUrl,
      vnp_Locale: VnpLocale.VN,
      vnp_OrderType: ProductCode.Books_Newspapers_Magazines,
    });

    console.log("✅ [VNPay] Payment URL generated successfully");

    return {
      success: true,
      paymentMethod: "VNPAY",
      paymentStatus: "PENDING",
      paymentUrl,
      transactionId: orderNumber,
      orderData,
    };
  }

  async confirmPayment(callbackParams) {
    console.log("🔍 [VNPay] Verifying return URL params...");

    const result = this.vnpay.verifyReturnUrl(callbackParams);

    console.log("📋 [VNPay] Verification result:", {
      isVerified: result.isVerified,
      isSuccess: result.isSuccess,
      message: result.message,
      vnp_ResponseCode: result.vnp_ResponseCode,
      vnp_TxnRef: result.vnp_TxnRef,
    });

    const responseCode = String(result.vnp_ResponseCode || "99");
    const englishMessage =
      VNPAY_RESPONSE_MESSAGES[responseCode] ||
      result.message ||
      "Payment verification failed";

    if (result.isVerified && result.isSuccess) {
      return {
        success: true,
        paymentStatus: "PAID",
        transactionId: String(result.vnp_TransactionNo || ""),
        message: VNPAY_RESPONSE_MESSAGES["00"] || "Payment completed successfully",
      };
    }

    return {
      success: false,
      paymentStatus: "FAILED",
      transactionId: String(result.vnp_TransactionNo || ""),
      message: englishMessage,
    };
  }
}

// Payment Service - Factory for payment providers
class PaymentService {
  constructor() {
    this.providers = {
      COD: new CODPaymentProvider(),
      VNPAY: new VNPayPaymentProvider(),
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
      VNPAY: "VNPay Online Payment",
    };
    return names[method] || method;
  }

  getPaymentMethodDescription(method) {
    const descriptions = {
      COD: "Pay with cash when you receive your order",
      VNPAY: "Pay via VNPay gateway (ATM, Credit Card, QR Code)",
    };
    return descriptions[method] || "";
  }
}

export default new PaymentService();
