import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { Settings } from '../modules/settings/settings.model.js';
import { User } from '../modules/auth/user.model.js';

const rawPhone = process.argv[2]?.trim() ?? '';
const phone = rawPhone.startsWith('+') ? rawPhone : `+91${rawPhone}`;

if (!/^\+91[6-9]\d{9}$/.test(phone)) {
  throw new Error('Usage: npm run admin:create -- <10-digit-Indian-mobile-or-E.164-number>');
}

try {
  await connectDatabase();
  const user = await User.findOneAndUpdate(
    { phoneE164: phone },
    { $set: { role: 'admin', status: 'active' }, $setOnInsert: { phoneE164: phone } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  await Settings.updateOne(
    { key: 'global' },
    {
      $setOnInsert: {
        key: 'global',
        businessName: 'eSakhi',
        city: 'Damoh',
        state: 'Madhya Pradesh',
        serviceableLocalities: [{ name: 'Damoh', postalCodes: ['470661'] }],
        deliveryEnabled: false,
        pickupEnabled: false,
        upiEnabled: false,
        cashEnabled: false,
        staffEnabled: false,
        stockReservationHours: null,
      },
    },
    { upsert: true, setDefaultsOnInsert: true },
  );
  console.info('Admin account provisioned. Sign in through the OTP flow.');
} finally {
  await disconnectDatabase();
}
