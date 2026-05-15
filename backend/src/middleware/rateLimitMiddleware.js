const buckets = new Map();

const rateLimit = ({ windowMs = 15 * 60 * 1000, max = 100, message = 'Too many requests' } = {}) => {
  return (req, res, next) => {
    const key = `${req.ip}:${req.originalUrl}`;
    const now = Date.now();
    const bucket = buckets.get(key) || { count: 0, resetAt: now + windowMs };

    if (now > bucket.resetAt) {
      bucket.count = 0;
      bucket.resetAt = now + windowMs;
    }

    bucket.count += 1;
    buckets.set(key, bucket);

    res.set('X-RateLimit-Limit', String(max));
    res.set('X-RateLimit-Remaining', String(Math.max(max - bucket.count, 0)));
    res.set('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));

    if (bucket.count > max) {
      return res.status(429).json({ message });
    }

    next();
  };
};

module.exports = rateLimit;
