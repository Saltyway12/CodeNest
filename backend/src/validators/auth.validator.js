/**
 * ---------------------------------------------------------
 *  Password Validation Utility
 * ---------------------------------------------------------
 *  FR : Valide la force du mot de passe selon une politique
 *       solide : minimum 8 caractères + majuscule + minuscule
 *       + chiffre + symbole.
 *
 *  EN : Validates password strength using a strong policy:
 *       at least 8 characters + uppercase + lowercase +
 *       digit + symbol.
 * ---------------------------------------------------------
 */

export function validatePassword(password) {
	const regex =
		/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

	return regex.test(password);
}
