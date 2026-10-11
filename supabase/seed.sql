-- Demo users must already exist in Supabase Auth with these email addresses.
-- Run schema.sql first. All non-admin demo users share the elderly user's circle.

WITH demo_users(email, role) AS (
  VALUES
    ('elderly@demo.com', 'elderly'),
    ('family@demo.com', 'family'),
    ('caregiver@demo.com', 'caregiver'),
    ('admin@demo.com', 'admin')
),
elderly_user AS (
  SELECT id
  FROM auth.users
  WHERE lower(email) = 'elderly@demo.com'
  LIMIT 1
)
INSERT INTO public.users (id, role, care_circle_id)
SELECT
  auth_user.id,
  demo_users.role,
  CASE WHEN demo_users.role = 'admin' THEN NULL ELSE elderly_user.id END
FROM demo_users
JOIN auth.users AS auth_user ON lower(auth_user.email) = demo_users.email
LEFT JOIN elderly_user ON true
ON CONFLICT (id) DO UPDATE
SET role = EXCLUDED.role,
    care_circle_id = EXCLUDED.care_circle_id;

-- Example medicines are assigned to the elderly demo user.
INSERT INTO public.medicines (user_id, name, dosage, time)
SELECT auth_user.id, sample.name, sample.dosage, sample.time
FROM auth.users AS auth_user
CROSS JOIN (
  VALUES
    ('Vitamin D', '1000 IU', TIME '08:00'),
    ('Blood pressure tablet', '5 mg', TIME '20:00'),
    ('Calcium', '500 mg', TIME '13:00')
) AS sample(name, dosage, time)
WHERE lower(auth_user.email) = 'elderly@demo.com'
ON CONFLICT (user_id, name, time) DO NOTHING;

-- One completed and one upcoming example dose per medicine, without duplicating
-- the same sample rows when this seed script is run more than once in a day.
INSERT INTO public.doses (medicine_id, taken, taken_at)
SELECT medicine.id, sample.taken, sample.taken_at
FROM (
  VALUES
    ('Vitamin D', true, now()),
    ('Blood pressure tablet', false, NULL::timestamptz),
    ('Calcium', true, now())
) AS sample(name, taken, taken_at)
JOIN public.medicines AS medicine ON medicine.name = sample.name
JOIN auth.users AS elderly_user ON elderly_user.id = medicine.user_id
WHERE lower(elderly_user.email) = 'elderly@demo.com'
  AND NOT EXISTS (
    SELECT 1
    FROM public.doses AS existing_dose
    WHERE existing_dose.medicine_id = medicine.id
      AND existing_dose.taken = sample.taken
      AND (
        (sample.taken_at IS NULL AND existing_dose.taken_at IS NULL)
        OR existing_dose.taken_at::date = sample.taken_at::date
      )
  );