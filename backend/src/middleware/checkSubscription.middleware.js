export default function checkSubscription(req, res, next) {
  try {
    const user = req.user;
    if (!user) {
      console.warn("⚠️ Subscription check failed: No user object found in request.");
      return res.status(401).json({ message: "User missing" });
    }

    // Admins bypass subscription checks
    if (user.role === "admin") {
      return next();
    }

    const now = new Date();
    const hasActiveSubscription = (user.subscription === "monthly" || user.subscription === "yearly") &&
      user.subscriptionExpiresAt &&
      new Date(user.subscriptionExpiresAt) > now;

    if (hasActiveSubscription) {
      return next();
    }

    console.warn(`🔒 Subscription check failed for user: ${user._id} (${user.email}). Status: ${user.subscription}. Expires: ${user.subscriptionExpiresAt}`);

    return res.status(403).json({
      message: "Active subscription required (monthly/yearly).",
      subscription: user.subscription,
      subscriptionExpiresAt: user.subscriptionExpiresAt,
    });
  } catch (err) {
    console.error("❌ Error in checkSubscription middleware:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
