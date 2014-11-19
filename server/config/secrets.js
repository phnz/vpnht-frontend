module.exports = {

  db: process.env.MONGODB || process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost:27017/membership',

  sessionSecret: process.env.SESSION_SECRET || 'vpn',

  mailgun: {
    user: process.env.MAILGUN_USER || 'vpn.ht',
    password: process.env.MAILGUN_PASSWORD || 'key-b49338f7497fb0f6b234e05d52fdcc9a'
  },

  stripeOptions: {
    apiKey: process.env.STRIPE_KEY || 'sk_test_fA51GLxl3DJldapBJSORtqUt',
    stripePubKey: process.env.STRIPE_PUB_KEY || 'pk_test_ypGXGUPbcJvWdwKite9JyRej',
    defaultPlan: 'free',
    plans: ['monthly', 'yearly'],
    planData: {
      'monthly': {
        name: 'Monthly',
        price: 5
      },
      'yearly': {
        name: 'Yearly',
        price: 40
      }
    }
  },

  googleAnalytics: process.env.GOOGLE_ANALYTICS || ''
};
