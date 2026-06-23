-- Seed de canciones para Alien Music Beta
-- Ejecutar DESPUÉS de la migración inicial

INSERT INTO songs (id, title, artist, album_title, duration, audio_url, cover_url) VALUES
  ('a0000001-0000-4000-8000-000000000001', 'Black Dog', 'Led Zeppelin', 'Led Zeppelin IV', 333, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 'https://upload.wikimedia.org/wikipedia/en/2/26/Led_Zeppelin_-_Led_Zeppelin_IV.jpg'),
  ('a0000001-0000-4000-8000-000000000002', 'Rock and Roll', 'Led Zeppelin', 'Led Zeppelin IV', 234, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', 'https://upload.wikimedia.org/wikipedia/en/2/26/Led_Zeppelin_-_Led_Zeppelin_IV.jpg'),
  ('a0000001-0000-4000-8000-000000000003', 'Stairway to Heaven', 'Led Zeppelin', 'Led Zeppelin IV', 482, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', 'https://upload.wikimedia.org/wikipedia/en/2/26/Led_Zeppelin_-_Led_Zeppelin_IV.jpg'),
  ('a0000001-0000-4000-8000-000000000004', 'Come Together', 'The Beatles', 'Abbey Road', 259, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', 'https://upload.wikimedia.org/wikipedia/en/4/42/Beatles_-_Abbey_Road.jpg'),
  ('a0000001-0000-4000-8000-000000000005', 'Something', 'The Beatles', 'Abbey Road', 183, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', 'https://upload.wikimedia.org/wikipedia/en/4/42/Beatles_-_Abbey_Road.jpg'),
  ('a0000001-0000-4000-8000-000000000006', 'Here Comes the Sun', 'The Beatles', 'Abbey Road', 185, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', 'https://upload.wikimedia.org/wikipedia/en/4/42/Beatles_-_Abbey_Road.jpg'),
  ('a0000001-0000-4000-8000-000000000007', 'War Pigs', 'Black Sabbath', 'Paranoid', 475, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3', 'https://upload.wikimedia.org/wikipedia/en/0/06/Black_Sabbath_Paranoid.jpg'),
  ('a0000001-0000-4000-8000-000000000008', 'Paranoid', 'Black Sabbath', 'Paranoid', 168, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', 'https://upload.wikimedia.org/wikipedia/en/0/06/Black_Sabbath_Paranoid.jpg'),
  ('a0000001-0000-4000-8000-000000000009', 'Hotel California', 'Eagles', 'Hotel California', 391, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', 'https://upload.wikimedia.org/wikipedia/en/4/49/Hotelcalifornia.jpg'),
  ('a0000001-0000-4000-8000-000000000010', 'Money', 'Pink Floyd', 'Dark Side of the Moon', 382, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', 'https://upload.wikimedia.org/wikipedia/en/3/3b/Dark_Side_of_the_Moon.png'),
  ('a0000001-0000-4000-8000-000000000011', 'Time', 'Pink Floyd', 'Dark Side of the Moon', 413, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', 'https://upload.wikimedia.org/wikipedia/en/3/3b/Dark_Side_of_the_Moon.png'),
  ('a0000001-0000-4000-8000-000000000012', 'Dreams', 'Fleetwood Mac', 'Rumours', 257, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 'https://upload.wikimedia.org/wikipedia/en/f/fb/FMacRumours.PNG'),
  ('a0000001-0000-4000-8000-000000000013', 'Purple Haze', 'Jimi Hendrix', 'Are You Experienced', 171, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', 'https://upload.wikimedia.org/wikipedia/en/4/4a/Areyouexperienced.jpg'),
  ('a0000001-0000-4000-8000-000000000014', 'Smoke on the Water', 'Deep Purple', 'Machine Head', 340, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3', 'https://upload.wikimedia.org/wikipedia/en/8/8a/Deep_Purple_-_Machine_Head.jpg'),
  ('a0000001-0000-4000-8000-000000000015', 'Brown Sugar', 'Rolling Stones', 'Sticky Fingers', 229, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 'https://upload.wikimedia.org/wikipedia/en/2/23/StickyFingersalbumcover.jpg'),
  ('a0000001-0000-4000-8000-000000000016', 'We Will Rock You', 'Queen', 'News of the World', 122, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', 'https://upload.wikimedia.org/wikipedia/en/0/0a/Queen_News_Of_The_World.png')
ON CONFLICT (id) DO NOTHING;
