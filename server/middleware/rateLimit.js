import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,    
  max: 5,                     
  message: { message: 'Too many attempts. Please wait a minute and try again.' },
  standardHeaders: true,     
  legacyHeaders: false,
});
