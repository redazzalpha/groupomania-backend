const passValidator = require('password-validator');

/*
 * This creates a schema for password validation
 * Password must be strong to be validated
 * 
 * According to this schema: 
 * 
 * length password must be at least 8 characters 
 * must have at least 1 digit
 * must have at least 1 letter
 * must have at least 1 special character
 * must have at least 1 upppercase letter
 * must have at least 1 lowercase letter
 * must not have no space
 * 
 * 
*/

const passwordSchema = new passValidator();

passwordSchema
    .is().min(8)
    .has().digits()
    .has().letters()
    .has().symbols()
    .has().uppercase()
    .has().lowercase()
    .has().not().spaces();



module.exports = passwordSchema;