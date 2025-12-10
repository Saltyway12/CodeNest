/**
 * ---------------------------------------------------------
 *  Login Rate Limiter
 * ---------------------------------------------------------
 *  FR : Limite les tentatives de connexion par adresse IP
 *       pour réduire les risques d'attaque par brute force.
 *
 *  EN : Limits login attempts per IP to reduce brute force
 *       attack risk.
 * ---------------------------------------------------------
 */

const attempts = new Map(); // key: ip, value: { count, lastAttempt }

export function loginRateLimiter(req, res, next) {
	const ip = req.ip || req.connection.remoteAddress || "unknown";
	const now = Date.now();
	const windowMs = 15 * 60 * 1000; // 15 minutes
	const maxAttempts = 10;

	const entry = attempts.get(ip);

	if (!entry) {
		attempts.set(ip, { count: 1, lastAttempt: now });
		return next();
	}

	// FR : Si la fenêtre de 15 minutes est dépassée, on réinitialise.
	// EN : If 15-minute window is over, reset counter.
	if (now - entry.lastAttempt > windowMs) {
		attempts.set(ip, { count: 1, lastAttempt: now });
		return next();
	}

	entry.count += 1;
	entry.lastAttempt = now;

	if (entry.count > maxAttempts) {
		return res
			.status(429)
			.json({ error: "Too many login attempts. Try again later." });
	}

	next();
}
