# Coli - Mobile App

A React Native app for package delivery through trusted travelers.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up Supabase:
   - Create a new Supabase project
   - Go to Settings > API to get your URL and anon key
   - Create a `.env.local` file with:
     ```
     EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
     EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

3. Set up database schema in Supabase SQL Editor:
   ```sql
   -- Profiles table (minimal)
   CREATE TABLE profiles (
     id UUID REFERENCES auth.users(id) PRIMARY KEY,
     name TEXT NOT NULL,
     email TEXT UNIQUE,
     photo TEXT,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );

   -- Announcements
   CREATE TABLE announcements (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id),
     announcement_type TEXT CHECK (announcement_type IN ('gp_offer','send_request')),
     departure_city TEXT NOT NULL,
     arrival_city TEXT NOT NULL,
     date DATE NOT NULL,
     time TIME,
     weight DECIMAL NOT NULL,
     price_per_kg DECIMAL,
     transport_mode TEXT CHECK (transport_mode IN ('voiture','bus','avion','train')),
     is_fragile BOOLEAN DEFAULT false,
     is_urgent BOOLEAN DEFAULT false,
     status TEXT DEFAULT 'active' CHECK (status IN ('active','taken','delivered')),
     whatsapp_number TEXT,
     -- Receiver information for send_request
     receiver_name TEXT,
     receiver_phone TEXT,
     receiver_email TEXT,
     package_value DECIMAL,
     package_photos TEXT[],
     description TEXT,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );

   -- Coli Spaces
   CREATE TABLE coli_spaces (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     announcement_id UUID REFERENCES announcements(id),
     sender_id UUID REFERENCES auth.users(id),
     gp_id UUID REFERENCES auth.users(id),
     receiver_id UUID REFERENCES auth.users(id),
     status TEXT DEFAULT 'created' CHECK (status IN ('created','accepted','in_transit','delivered','cancelled')),
     last_message_at TIMESTAMP,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW(),
     UNIQUE(announcement_id, sender_id, gp_id)
   );

   -- Messages
   CREATE TABLE messages (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     coli_space_id UUID REFERENCES coli_spaces(id),
     user_id UUID REFERENCES auth.users(id),
     message TEXT,
     attachments TEXT[],
     created_at TIMESTAMP DEFAULT NOW()
   );

   -- Package Validations
   CREATE TABLE package_validations (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     coli_space_id UUID REFERENCES coli_spaces(id),
     validation_type TEXT CHECK (validation_type IN ('sender_photo','gp_pickup','receiver_delivery')),
     user_id UUID REFERENCES auth.users(id),
     photo_urls TEXT[],
     created_at TIMESTAMP DEFAULT NOW()
   );

   -- Enable RLS
   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
   ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
   ALTER TABLE coli_spaces ENABLE ROW LEVEL SECURITY;
   ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
   ALTER TABLE package_validations ENABLE ROW LEVEL SECURITY;

   -- If you already have the profiles table created, add the email column:
   ALTER TABLE profiles ADD COLUMN email TEXT UNIQUE;

   -- Policies for profiles
   CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
   CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
   CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

   -- Policies for announcements (public read)
   CREATE POLICY "Anyone can view announcements" ON announcements FOR SELECT USING (true);
   CREATE POLICY "Users can create announcements" ON announcements FOR INSERT WITH CHECK (auth.uid() = user_id);

   -- Policies for coli_spaces
   CREATE POLICY "Users can view own coli_spaces" ON coli_spaces FOR SELECT USING (auth.uid() IN (SELECT sender_id FROM coli_spaces WHERE id = coli_space_id) OR auth.uid() IN (SELECT gp_id FROM coli_spaces WHERE id = coli_space_id) OR auth.uid() IN (SELECT receiver_id FROM coli_spaces WHERE id = coli_space_id));
   CREATE POLICY "Users can insert messages in own coli_spaces" ON messages FOR INSERT WITH CHECK (auth.uid() IN (SELECT sender_id FROM coli_spaces WHERE id = coli_space_id) OR auth.uid() IN (SELECT gp_id FROM coli_spaces WHERE id = coli_space_id) OR auth.uid() IN (SELECT receiver_id FROM coli_spaces WHERE id = coli_space_id));

   -- Policies for package_validations
   CREATE POLICY "Users can view validations in own coli_spaces" ON package_validations FOR SELECT USING (auth.uid() IN (SELECT sender_id FROM coli_spaces WHERE id = coli_space_id) OR auth.uid() IN (SELECT gp_id FROM coli_spaces WHERE id = coli_space_id) OR auth.uid() IN (SELECT receiver_id FROM coli_spaces WHERE id = coli_space_id));
   CREATE POLICY "Users can insert validations in own coli_spaces" ON package_validations FOR INSERT WITH CHECK (auth.uid() IN (SELECT sender_id FROM coli_spaces WHERE id = coli_space_id) OR auth.uid() IN (SELECT gp_id FROM coli_spaces WHERE id = coli_space_id) OR auth.uid() IN (SELECT receiver_id FROM coli_spaces WHERE id = coli_space_id));
