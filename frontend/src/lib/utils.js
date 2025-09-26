/**
 * Fonction de capitalisation de chaîne de caractères
 * Met en majuscule la première lettre et conserve le reste en minuscules
 * @param {string} str - Chaîne de caractères à capitaliser
 * @returns {string} - Chaîne avec première lettre en majuscule
 */
export const capitialize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
