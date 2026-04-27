 const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ message: 'Please fill all required fields' });
  }
  console.log(`Contact form submitted by ${name} (${email}): ${subject} - ${message}`);
  res.json({ message: 'Thank you for contacting us! We will get back to you soon.' });
});

module.exports = router;

