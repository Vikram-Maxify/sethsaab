const axios = require("axios");

const Deposit = require("../models/Deposit.js");
const User = require("../models/userModel");
const TransactionHistory = require("../models/TransactionHistory");
const AdminGateway = require("../models/AdminGateway");

// ================= Create Deposit Request =================
const createDeposit = async (req, res) => {
  try {
    const { gatewayId, paymentMethod, channel, amount, utr } = req.body;

    // Validate amount early
    if (!amount) {
      return res.status(400).json({
        success: false,
        message: "Amount is required",
      });
    }

    const numericAmount = Number(amount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount",
      });
    }

    const user = await User.findById(req.user.id);

    console.log(user)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let finalPaymentMethod = paymentMethod;
    let finalChannel = channel;
    let resolvedGatewayId = null;

    const usdRet = 92;
    let money = 0;

    // =====================================================
    // GATEWAY SELECTED
    // =====================================================

    if (gatewayId) {
      const gateway = await AdminGateway.findById(gatewayId);

      console.log("gateway", gateway);

      if (!gateway) {
        return res.status(404).json({
          success: false,
          message: "Payment gateway not found",
        });
      }

      if (gateway.status !== 1) {
        return res.status(400).json({
          success: false,
          message:
            "Selected payment gateway is currently disabled/inactive",
        });
      }

      // Check gateway transaction limits
      if (
        numericAmount < gateway.minLimit ||
        numericAmount > gateway.maxLimit
      ) {
        return res.status(400).json({
          success: false,
          message: `Deposit amount must be between ${gateway.minLimit} and ${gateway.maxLimit} for this gateway.`,
        });
      }

      resolvedGatewayId = gateway._id;
      finalChannel = gateway.name;

      // =====================================================
      // AUTOMATIC GATEWAY
      // =====================================================

      if (gateway.mode === "automatic") {
        finalPaymentMethod = "INR";
        money = numericAmount;

        const orderId = `DEP${Date.now()}`;

        // Create pending deposit
        const deposit = await Deposit.create({
          userId: user._id,
          gatewayId: resolvedGatewayId,
          uid: user.uuid,
          phone: user.mobile,
          orderId,
          paymentMethod: finalPaymentMethod,
          type: paymentMethod,
          channel: finalChannel,
          amount: money,
          exchangeRate: 0,
          transactionId: orderId,
          status: 0,
        });

        // Callback URL
        const callbackUrl =
          process.env.GATEWAY_CALLBACK_URL ||
          `${req.protocol}://${req.get("host")}/api/deposit/callback`;

        const gatewayBaseUrl =
          gateway.gatewayUrl || "https://mch.voterx.xyz";

        const payload = {
          amount: Math.round(numericAmount),
          order_id: orderId,
          customer_name: user.username || user.mobile,
          description: `Automatic deposit via ${gateway.name}`,
          callback_url: callbackUrl,
        };

        try {
          const { data: gatewayResponse } = await axios.post(
            `${gatewayBaseUrl}/api/create-order`,
            payload,
            {
            }
          );

          console.log("gatewayResponse", gatewayResponse);

          if (
            gatewayResponse?.status === "success" &&
            gatewayResponse?.data?.payment_url
          ) {
            deposit.paymentUrl = gatewayResponse.data.payment_url;

            if (gatewayResponse.data.order_id) {
              deposit.orderId = String(gatewayResponse.data.order_id);
            }

            await deposit.save();

            // Transaction History
            await TransactionHistory.create({
              orderId,
              userId: user._id,
              uid: user.uuid,
              phone: user.mobile,
              type: "Deposit",
              amount: money,
              status: 0,
              remark: `Pending automatic deposit initiated via ${finalChannel}`,
            });

            return res.status(201).json({
              success: true,
              message: "Automatic payment order created successfully.",
              paymentUrl: gatewayResponse.data.payment_url,
              gatewayResponse,
              deposit,
            });
          }

          // Gateway returned error
          deposit.status = 2;
          await deposit.save();

          return res.status(400).json({
            success: false,
            message:
              gatewayResponse?.error ||
              "Failed to create payment order on gateway",
          });
        } catch (gatewayErr) {
          deposit.status = 2;
          await deposit.save();

          console.error(
            "Gateway Create-Order Error:",
            gatewayErr.response?.data || gatewayErr.message
          );

          return res.status(502).json({
            success: false,
            message:
              "Payment gateway request failed. Please try again.",
          });
        }
      }

      // =====================================================
      // MANUAL GATEWAY
      // =====================================================

      if (gateway.type === "Crypto") {
        finalPaymentMethod = "USDT";
        money = numericAmount * usdRet;
      } else {
        finalPaymentMethod = "INR";
        money = numericAmount;
      }
    } else {
      // =====================================================
      // OLD FRONTEND FALLBACK
      // =====================================================

      if (!paymentMethod || !channel) {
        return res.status(400).json({
          success: false,
          message:
            "gatewayId (or paymentMethod and channel) is required",
        });
      }

      finalPaymentMethod = paymentMethod;
      finalChannel = channel;

      money =
        finalPaymentMethod === "INR"
          ? numericAmount
          : numericAmount * usdRet;
    }

    // =====================================================
    // CREATE MANUAL DEPOSIT
    // =====================================================

    const orderId = `DEP${Date.now()}`;

    let imageUrl = "";

    if (
      req.files &&
      req.files.image &&
      req.files.image[0]
    ) {
      imageUrl = req.files.image[0].path;
    }

    const deposit = await Deposit.create({
      userId: user._id,
      gatewayId: resolvedGatewayId,
      uid: user.uuid,
      phone: user.mobile,
      username: user.username,
      orderId,
      paymentMethod: finalPaymentMethod,
      type: paymentMethod,
      channel: finalChannel,
      amount: money,
      exchangeRate:
        finalPaymentMethod === "USDT" ? usdRet : 0,
      transactionId: orderId,
      utr,
      paymentProof: imageUrl,
    });

    await TransactionHistory.create({
      orderId,
      userId: user._id,
      uid: user.uuid,
      phone: user.mobile,
      type: "Deposit",
      amount: money,
      status: deposit.status,
      remark: `Deposit request submitted via ${finalChannel}`,
    });

    return res.status(201).json({
      success: true,
      message: "Deposit request submitted successfully.",
      deposit,
    });
  } catch (error) {
    console.error("CREATE DEPOSIT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// =====================================================
// ONLINE PAYMENT CALLBACK
// =====================================================

const onlinePayCallback = async (req, res) => {
  console.log(
    "GATEWAY CALLBACK RECEIVED - Query:",
    req.query,
    "Body:",
    req.body
  );

  try {
    const { order_id } = req.query;

    const resolvedOrderId =
      order_id || req.body.order_id;

    if (!resolvedOrderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID missing",
      });
    }

    // Find deposit
    const deposit = await Deposit.findOne({
      orderId: resolvedOrderId,
    });

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: "Deposit record not found",
      });
    }

    // Already processed
    if (deposit.status === 1) {
      return res.status(200).json({
        success: true,
        message: "Already processed",
      });
    }

    // Find gateway
    const gateway = await AdminGateway.findById(
      deposit.gatewayId
    );

    if (!gateway) {
      return res.status(404).json({
        success: false,
        message: "Associated payment gateway not found",
      });
    }

    const gatewayBaseUrl =
      gateway.gatewayUrl || "https://mch.voterx.xyz";

    // Verify payment
    const { data: verificationData } =
      await axios.post(
        `${gatewayBaseUrl}/api/check-status`,
        {
          order_id: resolvedOrderId,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "X-API-Key":
              gateway.apiKey ||
              "pi_live_22343a6ab9a88b57b0877cd7b4328d540dba19a870df1927",
            "X-API-Secret":
              gateway.secretKey ||
              "sk_live_194873f938eec0bcd5c3d803a223decdf0ffa7a037217ef4",
          },
        }
      );

    // =====================================================
    // PAYMENT FAILED
    // =====================================================

    if (
      verificationData.status !== "success" ||
      verificationData.payment_status !== "success"
    ) {
      deposit.status = 2;

      await deposit.save();

      await TransactionHistory.create({
        orderId: resolvedOrderId,
        userId: deposit.userId,
        uid: deposit.uid,
        phone: deposit.phone,
        type: "Deposit",
        amount: deposit.amount,
        status: 2,
        remark: "Automatic payment verification failed",
      });

      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    // =====================================================
    // FIND USER
    // =====================================================

    const user = await User.findById(
      deposit.userId
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User associated with deposit not found",
      });
    }

    // =====================================================
    // CREDIT WALLET
    // =====================================================

    const creditAmount = Number(
      verificationData.data?.amount ||
        deposit.amount
    );

    user.wallet = Number(
      (
        Number(user.wallet || 0) +
        creditAmount
      ).toFixed(2)
    );

    await user.save();

    // =====================================================
    // REFERRAL BONUS - 10%
    // =====================================================

    if (user.referral) {
      const parentUser = await User.findOne({
        refCode: user.referral,
      });

      if (parentUser) {
        const bonusAmount = Number(
          (creditAmount * 0.1).toFixed(2)
        );

        parentUser.wallet = Number(
          (
            Number(parentUser.wallet || 0) +
            bonusAmount
          ).toFixed(2)
        );

        await parentUser.save();

        await TransactionHistory.create({
          userId: parentUser._id,
          uid: parentuser.uuid,
          phone: parentUser.mobile,
          amount: bonusAmount,
          type: "Referral Bonus",
          status: 1,
          remark: `10% referral bonus from deposit of ${user.username}`,
        });
      }
    }

    // =====================================================
    // UPDATE DEPOSIT
    // =====================================================

    deposit.status = 1;

    deposit.utr =
      verificationData.data?.utr ||
      deposit.utr;

    deposit.transactionId =
      verificationData.data?.gateway_txn_id ||
      deposit.transactionId;

    await deposit.save();

    // =====================================================
    // SUCCESS TRANSACTION HISTORY
    // =====================================================

    await TransactionHistory.create({
      orderId: resolvedOrderId,
      userId: user._id,
      uid: user.uuid,
      phone: user.mobile,
      type: "Deposit",
      amount: creditAmount,
      status: 1,
      remark: `Wallet credited via automatic payment gateway: ${gateway.name}`,
    });

    return res.status(200).json({
      success: true,
      message: "Deposit successful",
    });
  } catch (error) {
    console.error(
      "GATEWAY CALLBACK ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Callback failed",
      error: error.message,
    });
  }
};

// =====================================================
// GET MY DEPOSIT HISTORY
// =====================================================

const getMyDeposits = async (req, res) => {
  try {
    const {
      status,
      paymentMethod,
      channel,
      phone,
      username,
      orderId,
      transactionId,
      utr,
      fromDate,
      toDate,
      minAmount,
      maxAmount,
      page = 1,
      limit = 10,
      sort = "desc",
    } = req.query;

    const query = {
      userId: req.user.id,
    };

    console.log("query", query);

    // Status
    if (status) {
      query.status = status;
    }

    // Payment Method
    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    // Channel
    if (channel) {
      query.channel = channel;
    }

    // Phone
    if (phone) {
      query.phone = {
        $regex: phone,
        $options: "i",
      };
    }

    // Username
    if (username) {
      query.username = {
        $regex: username,
        $options: "i",
      };
    }

    // Order ID
    if (orderId) {
      query.orderId = {
        $regex: orderId,
        $options: "i",
      };
    }

    // Transaction ID
    if (transactionId) {
      query.transactionId = {
        $regex: transactionId,
        $options: "i",
      };
    }

    // UTR
    if (utr) {
      query.utr = {
        $regex: utr,
        $options: "i",
      };
    }

    // Amount
    if (minAmount || maxAmount) {
      query.amount = {};

      if (minAmount) {
        query.amount.$gte = Number(minAmount);
      }

      if (maxAmount) {
        query.amount.$lte = Number(maxAmount);
      }
    }

    // Date
    if (fromDate || toDate) {
      query.createdAt = {};

      if (fromDate) {
        query.createdAt.$gte = new Date(fromDate);
      }

      if (toDate) {
        const endDate = new Date(toDate);

        endDate.setHours(
          23,
          59,
          59,
          999
        );

        query.createdAt.$lte = endDate;
      }
    }

    const total =
      await Deposit.countDocuments(query);

    const deposits =
      await Deposit.find(query)
        .sort({
          createdAt:
            sort === "asc" ? 1 : -1,
        })
        .skip(
          (Number(page) - 1) *
            Number(limit)
        )
        .limit(Number(limit));

    return res.status(200).json({
      success: true,
      total,
      currentPage: Number(page),
      totalPages: Math.ceil(
        total / Number(limit)
      ),
      deposits,
    });
  } catch (error) {
    console.error(
      "GET MY DEPOSITS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// =====================================================
// GET MY TURNOVER HISTORY
// =====================================================

const getMyTurnoverHistory = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // =====================================================
    // DOWNLINE COUNT
    // =====================================================

    const downlineCount =
      await User.countDocuments({
        referral: user.refCode,
      });

    // =====================================================
    // REFERRAL COMMISSIONS
    // =====================================================

    const commissions =
      await TransactionHistory.find({
        userId: userId.toString(),
        type: "Referral Bonus",
        status: 1,
      }).sort({
        createdAt: -1,
      });

    // =====================================================
    // FORMAT COMMISSIONS
    // =====================================================

    const formattedCommissions =
      commissions.map((c) => {
        const match = c.remark
          ? c.remark.match(
              /from deposit of (.+)/
            )
          : null;

        const referredUsername =
          match
            ? match[1]
            : "Referred User";

        // Commission is 10%
        const rechargeAmount =
          Number(
            (c.amount * 10).toFixed(2)
          );

        return {
          id: c._id,
          amount: c.amount,
          rechargeAmount,
          referredUsername,

          date: c.createdAt
            ? new Date(
                c.createdAt
              ).toLocaleDateString(
                "en-GB",
                {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                }
              )
            : "-",

          createdAt: c.createdAt,
        };
      });

    // =====================================================
    // DATE CALCULATIONS
    // =====================================================

    const now = new Date();

    const oneWeekAgo =
      new Date();

    oneWeekAgo.setDate(
      now.getDate() - 7
    );

    const oneMonthAgo =
      new Date();

    oneMonthAgo.setDate(
      now.getDate() - 30
    );

    // =====================================================
    // COMMISSION STATS
    // =====================================================

    let weeklyCommission = 0;
    let monthlyCommission = 0;
    let totalCommission = 0;

    formattedCommissions.forEach(
      (c) => {
        totalCommission += Number(
          c.amount || 0
        );

        const cDate = new Date(
          c.createdAt
        );

        if (cDate >= oneWeekAgo) {
          weeklyCommission += Number(
            c.amount || 0
          );
        }

        if (cDate >= oneMonthAgo) {
          monthlyCommission += Number(
            c.amount || 0
          );
        }
      }
    );

    totalCommission = Number(
      totalCommission.toFixed(2)
    );

    weeklyCommission = Number(
      weeklyCommission.toFixed(2)
    );

    monthlyCommission = Number(
      monthlyCommission.toFixed(2)
    );

    // =====================================================
    // TURNOVER
    // =====================================================

    const totalTurnover =
      Number(
        (
          totalCommission * 10
        ).toFixed(2)
      );

    const weeklyTurnover =
      Number(
        (
          weeklyCommission * 10
        ).toFixed(2)
      );

    const monthlyTurnover =
      Number(
        (
          monthlyCommission * 10
        ).toFixed(2)
      );

    // =====================================================
    // RESPONSE
    // =====================================================

    return res.status(200).json({
      success: true,

      downlineCount,

      stats: {
        totalCommission,
        weeklyCommission,
        monthlyCommission,

        totalTurnover,
        weeklyTurnover,
        monthlyTurnover,
      },

      commissions:
        formattedCommissions,
    });
  } catch (error) {
    console.error(
      "GET TURNOVER HISTORY ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// =====================================================
// COMMONJS EXPORT
// =====================================================

module.exports = {
  createDeposit,
  onlinePayCallback,
  getMyDeposits,
  getMyTurnoverHistory,
};