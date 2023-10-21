const Joi = require("joi");

const emailSchema = Joi.string()
  .email({ tlds: { allow: false } }) // Disallow top-level domains (TLDs) for custom domain emails
  .max(100)
  .required()
  .messages({
    "string.base": "Email should be a string",
    "string.email": "Invalid email entered",
    "string.empty": "Email is required",
    "any.required": "Email is required",
    "string.max": "Email address cannot exceed 100 characters",
  });

const passwordSchema = Joi.string()
  .pattern(
    new RegExp("(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])(?=.{8,})")
  )
  .required()
  .messages({
    "string.pattern.base":
      "Password must be at least 8 characters long and contain at least one letter, one digit, and one special character",
    "any.required": "Password is required",
    "string.empty": "Password is required",
  });

const usernameSchema = Joi.string()
  .alphanum()
  .min(3)
  .max(25)
  .required()
  .messages({
    "string.base": "Username should be a string",
    "string.alphanum": "Username should only contain letters and numbers",
    "string.min": "Username must be at least 3 characters long",
    "string.max": "Username cannot exceed 25 characters",
    "any.required": "Username is required",
    "string.empty": "Username is required",
  });

const nameSchema = Joi.string()
  .min(2)
  .max(50)
  .required()
  .pattern(/^[a-zA-Z\s]+$/)
  .messages({
    "string.base": "Name should be a string",
    "string.min": "Name must be at least 2 characters long",
    "string.max": "Name cannot exceed 50 characters",
    "any.required": "Name is required",
    "string.pattern.base": "Name can only contain letters and spaces",
    "string.empty": "Name is required",
  });

const dobSchema = Joi.string()
  .custom((value, helpers) => {
    const date = new Date(value);

    if (isNaN(date.getTime())) {
      return helpers.error("date.invalid");
    }

    const currentDate = new Date();
    const minimumBirthDate = new Date(currentDate);
    minimumBirthDate.setFullYear(currentDate.getFullYear() - 100);
    const maximumBirthDate = new Date(currentDate);
    maximumBirthDate.setFullYear(currentDate.getFullYear() - 10);

    if (date < minimumBirthDate || date >= maximumBirthDate) {
      return helpers.error("date.invalidRange");
    }
  }, "custom date validation")
  .required()
  .messages({
    "any.required": "Date of birth is required",
    "date.invalid": "Invalid date entered",
    "date.invalidRange": "You should be between 10 years and 100 years of age",
    "string.empty": "DOB is required",
  });

const bioDataSchema = Joi.string()
  .min(10)
  .max(250)
  .pattern(/^[a-zA-Z!.\s]+$/)
  .messages({
    "string.base": "Biodata should be a string",
    "string.min": "Biodata must be at least 10 characters long",
    "string.max": "Biodata cannot exceed 250 characters",
    "string.pattern.base": "Biodata can only contain letters and spaces",
  });

const registrationSchema = Joi.object({
  email: emailSchema,
  password: passwordSchema,
  username: usernameSchema,
  name: nameSchema,
  dob: dobSchema,
});

const loginSchema = Joi.object({
  email: emailSchema,
  password: passwordSchema,
});

const editProfileSchema = Joi.object({
  name: nameSchema,
  dob: dobSchema,
  email: emailSchema,
  bioData: bioDataSchema,
  username: usernameSchema,
  password: passwordSchema,
});

module.exports = {
  registrationSchema,
  loginSchema,
  emailSchema,
  editProfileSchema,
  passwordSchema,
};
