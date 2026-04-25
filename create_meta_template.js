const token = 'EAAUzYdT9F58BRSV8uDeE2PXVfhzgzcsyNZA6CqloOj05QDJYGmaHU8ZCZCzJgzdcFAhK3ZCSenr7Eubtr9xHYlZB7uHkMXJxlVKZAr2XZBwiBZB9MAa5ULZAApcm2hBCqtR4b2bHtLVLPgSHRQlWPqAydplXfYqjvZBQdjHExEYQ71fnr6xVMtZAuplfyX7VF9IGmzlRgZCpJz1UdPZAi4CAuSa7TipEIsevlebZCZAlPQ0ZAP4kQWcsBKyXD0k48eJMD7QIwfO9ZCp6zd23OZCDgdwe641Bsy';
const wabaId = '846635377775862';

fetch(`https://graph.facebook.com/v19.0/${wabaId}/message_templates`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'alrehla_welcome_lead_v1',
    language: 'ar',
    category: 'MARKETING',
    components: [
      {
        type: 'BODY',
        text: 'أهلاً بك في رحلتك! 🚀\nسعداء ببدء مسارك نحو استرداد قيادتك على طاقتك وعلاقاتك.\n\nللبدء في استكشاف خريطتك وتفعيل حسابك، يرجى الرد على هذه الرسالة.'
      },
      {
        type: 'BUTTONS',
        buttons: [
          {
            type: 'QUICK_REPLY',
            text: 'يلا نبدأ'
          }
        ]
      }
    ]
  })
})
.then(res => res.json())
.then(data => console.log(JSON.stringify(data, null, 2)))
.catch(console.error);
