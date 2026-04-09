-- ═══════════════════════════════════════════════════════════
-- IELTS Speaking Forecast Q2/2026 — Seed Data
-- Run AFTER schema-2.1.sql
-- Source: langmaster.edu.vn, study4.com, wiseenglish.edu.vn
-- ═══════════════════════════════════════════════════════════

-- ── PART 1 TOPICS (20 topics) ───────────────────────────────

INSERT INTO public.global_topics (name, module, part, category, sample_questions, is_forecast, forecast_quarter) VALUES
('Daily Routine', 'speaking', 1, 'Lifestyle', '["Do you often go to bed late or early?","What part of your day do you like best?","Do you think it is important to have a daily routine for your study?","Have you ever changed your routine?","What is your daily study routine?","How do you organise your study time?","Do you ever change your plans?"]', true, 'Q2/2026'),

('Stages in Life', 'speaking', 1, 'Abstract', '["How do people remember each stage of their lives?","At what age do you think people are the happiest?","Do you enjoy being the age you are now?","What did you often do with your friends in your childhood?"]', true, 'Q2/2026'),

('Views', 'speaking', 1, 'Lifestyle', '["Do you like taking pictures of different views?","Do you prefer views in urban areas or rural areas?","Do you prefer views in your own country or in other countries?"]', true, 'Q2/2026'),

('Hobbies', 'speaking', 1, 'Lifestyle', '["Do you have the same hobbies as your family members?","Do you have a hobby that you''ve had since childhood?","Did you have any hobbies when you were a child?","Do you have any hobbies?"]', true, 'Q2/2026'),

('Scenery', 'speaking', 1, 'Nature', '["Where can you enjoy beautiful views where you live?","What''s the best view that you have ever enjoyed?","Do you take photos of good views?","Do you book rooms that have good views when you go travelling?","Do you look out the window at the scenery when travelling by bus or car?"]', true, 'Q2/2026'),

('Buildings', 'speaking', 1, 'Places', '["Are there tall buildings near your home?","Do you take photos of buildings?","Is there a building that you would like to visit?"]', true, 'Q2/2026'),

('Public Gardens and Parks', 'speaking', 1, 'Places', '["Do you often visit parks or public gardens?","What do you usually do when you go to a park?","Are there many parks in your hometown?","Do you prefer going to parks alone or with others?"]', true, 'Q2/2026'),

('History', 'speaking', 1, 'Education', '["Did you enjoy learning history at school?","What kind of historical topics interest you the most?","Do you often watch programs or read books about history?","Is it important to learn about history? Why?","Have you ever visited a historical place?"]', true, 'Q2/2026'),

('Teenagers', 'speaking', 1, 'Society', '["Do you think teenagers today are different from those in the past?","What challenges do teenagers usually face?","Do you enjoy spending time with teenagers?","How can adults better understand teenagers?"]', true, 'Q2/2026'),

('Carrying', 'speaking', 1, 'Daily Life', '["Do you prefer carrying a backpack or a handbag?","What do you usually carry with you every day?","Have you ever carried something very heavy?","Do you like to carry many things when you go out?","How do you usually carry your belongings when traveling?"]', true, 'Q2/2026'),

('Flowers', 'speaking', 1, 'Nature', '["Do you like flowers?","What is your favorite type of flower?","Do you often buy flowers for someone?","Are flowers important in your culture?","Have you ever grown flowers yourself?"]', true, 'Q2/2026'),

('Weather', 'speaking', 1, 'Nature', '["What is the weather usually like where you live?","What kind of weather do you like the most?","Do you enjoy the weather in your area?","Do you often check the weather forecast?","Do you like hot and dry weather?","What do you usually do when it''s hot?"]', true, 'Q2/2026'),

('Spending Time by Yourself', 'speaking', 1, 'Lifestyle', '["Do you usually spend time by yourself?","How do you usually spend your time by yourself?","Do you like spending time by yourself?","What did you do last time you were by yourself?"]', true, 'Q2/2026'),

('Chocolate', 'speaking', 1, 'Food & Drink', '["Do you like chocolate?","Did you like chocolate when you were a child?","How often do you eat chocolate?","Why do you think chocolate is popular all over the world?","What''s your favourite flavour of chocolate?","Did you give chocolate as a present to someone?","Do you think it''s good to use chocolate as a gift to others?"]', true, 'Q2/2026'),

('Praising', 'speaking', 1, 'Communication', '["Have you achieved anything recently?","How do you feel when you''re praised?","Do you often praise others?","Do you think parents should praise their children often?"]', true, 'Q2/2026'),

('Internet', 'speaking', 1, 'Technology', '["When did you start using the internet?","How often do you go online?","How does the Internet influence people?","Do you think you spend too much time online?"]', true, 'Q2/2026'),

('Reading', 'speaking', 1, 'Education', '["Which do you prefer, reading books or watching movies?","Have you ever read a novel that has been adapted into a film?","Are your reading habits now different than before?","Do you often read books? When?","Do you read more or less now than when you were younger?","Do you like reading?","Do you prefer to read on paper or on a screen?"]', true, 'Q2/2026'),

('Day Off', 'speaking', 1, 'Lifestyle', '["When was the last time you had a few days off?","What do you usually do when you have days off?","Do you usually spend your days off with your parents or with your friends?","What would you like to do if you had a day off tomorrow?"]', true, 'Q2/2026'),

('Pets', 'speaking', 1, 'Animals', '["Do you keep a pet?","Did you have any pets when you were a child?","What''s your favorite animal? Why?","Where do you prefer to keep your pet, indoors or outdoors?","Have you ever had a pet before?"]', true, 'Q2/2026'),

('Food', 'speaking', 1, 'Food & Drink', '["What is your favorite food?","What kind of food did you like when you were young?","Do you eat different foods at different times of the year?","Has your favourite food changed since you were a child?","What kinds of food do you particularly like?","What kinds of food are most popular in your country?"]', true, 'Q2/2026'),

('Walking', 'speaking', 1, 'Health', '["Do you walk a lot?","Did you often go outside to have a walk when you were a child?","Why do people like to walk in parks?","Where would you like to take a long walk if you had the chance?","Where did you go for a walk lately?"]', true, 'Q2/2026');

-- ── PART 2+3 TOPICS (15 topics) ─────────────────────────────

INSERT INTO public.global_topics (name, module, part, category, sample_questions, is_forecast, forecast_quarter) VALUES
('Describe a quiet place you like to go', 'speaking', 2, 'Places', '["How do people express happiness in your culture?","How do people spend their leisure time in your country?","How does technology affect the way people spend their leisure time?","Do you think only old people have time for leisure?","Why do old people prefer to live in quiet places?","Why are there more noises made at home now than in the past?"]', true, 'Q2/2026'),

('Describe a foreign country you would like to stay or work for a short period', 'speaking', 2, 'Travel', '["Why do people sometimes go to other cities or other countries to travel?","Why do people like travelling?","What jobs can people do abroad for a short period of time?","Is it good that now people have an opportunity to work abroad?"]', true, 'Q2/2026'),

('Describe a person who encouraged you to protect nature', 'speaking', 2, 'People', '["How can parents teach their children to protect nature?","Should schools teach children to get close to nature?","Do you think there should be laws to protect nature?"]', true, 'Q2/2026'),

('Describe a music event that you didn''t enjoy', 'speaking', 2, 'Events', '["Why do people enjoy attending live music events?","What makes a music event enjoyable for audiences?","How does music influence people''s emotions?","Do you think live music is more powerful than recorded music? Why?","Why do different people have different tastes in music?"]', true, 'Q2/2026'),

('Describe a person who solved a problem in a smart way', 'speaking', 2, 'People', '["Do you think children are born smart or they learn to become smart?","How do children become smart at school?","Why are some people well-rounded and others only good at one thing?","Why does modern society need talents of all kinds?","Are people born clever or need to learn to be clever?"]', true, 'Q2/2026'),

('Describe a person who often helps others', 'speaking', 2, 'People', '["How can children help their parents at home?","Should children be taught to help others?","What makes children help each other at school?","Should students do community service? Why?","Do students in your country do volunteer work?","Why do some people do volunteer work all over the world?"]', true, 'Q2/2026'),

('Describe a movie you watched and enjoyed recently', 'speaking', 2, 'Media', '["What kinds of movies do you think are successful in your country?","What are the factors that make a successful movie?","Do Vietnamese people prefer to watch domestic movies or foreign movies?","Do you think only well-known directors can create the best movies?","Do you think successful movies should have well-known actors or actresses in leading roles?"]', true, 'Q2/2026'),

('Describe an item on which you spent more than expected', 'speaking', 2, 'Objects', '["Do you often buy more than you expected?","What do you think young people spend most of their money on?","Do you think it is important to save money? Why?","Do people buy things they don''t need?","Is it good and necessary to teach children to save money?"]', true, 'Q2/2026'),

('Describe a time when you encouraged someone to do something they didn''t want to do', 'speaking', 2, 'Events', '["How could employers motivate their staff?","Do you think money is the most important motivating factor at work?","Is the role of a leader important in a group?","How could leaders encourage their employees?","Is it a good thing that a leader likes taking risks?","There are more male than female world leaders. Do you think this will change in the future?"]', true, 'Q2/2026'),

('Describe a person who makes plans a lot', 'speaking', 2, 'People', '["Do you think it''s important to plan ahead?","Do you think children should plan their future careers?","Should children ask their teachers or parents for advice when making plans?","What activities do we need to plan ahead?","Is making study plans popular among young people?","Do you think choosing a college major is closely related to a person''s future career?"]', true, 'Q2/2026'),

('Describe a time when you felt proud of a family member', 'speaking', 2, 'People', '["When would parents feel proud of their children?","Should parents reward children? Why and how?","Is it good to reward children too often? Why?","On what occasions would adults be proud of themselves?","Do rewards help a child become better?","What do you think about children working hard just for grades?"]', true, 'Q2/2026'),

('Describe your favorite place in your house where you can relax', 'speaking', 2, 'Places', '["Why is it important for people to have a place to relax at home?","How do people usually relax in their homes?","Do people spend more time at home nowadays than in the past?","What are the differences between relaxing at home and outside?","How can the design of a house affect people''s mood?"]', true, 'Q2/2026'),

('Describe a skill you would like to learn', 'speaking', 2, 'Abstract', '["Why do people want to learn new skills?","What skills are important for young people today?","Is it better to learn skills online or in a classroom?","How long does it take to master a skill?","Do you think people should keep learning new skills throughout their lives?"]', true, 'Q2/2026'),

('Describe a piece of technology you find useful', 'speaking', 2, 'Technology', '["How has technology changed people''s daily lives?","What are the advantages and disadvantages of technology?","Do older people find it difficult to use modern technology?","Will technology make people more or less social in the future?","How important is technology in education nowadays?"]', true, 'Q2/2026'),

('Describe a time you were late for something important', 'speaking', 2, 'Events', '["Why do people sometimes arrive late?","Is being punctual important in your country?","How do people feel when others are late?","What can people do to manage their time better?","Do you think technology helps people be more punctual?"]', true, 'Q2/2026');

-- ── GENERAL VOCAB TOPICS (seed from existing constants) ──────

INSERT INTO public.global_topics (name, module, part, category, sample_questions, is_forecast, forecast_quarter) VALUES
('Education', 'vocab', NULL, 'Academic', '[]', false, NULL),
('Technology', 'vocab', NULL, 'Academic', '[]', false, NULL),
('Environment', 'vocab', NULL, 'Academic', '[]', false, NULL),
('Health & Medicine', 'vocab', NULL, 'Academic', '[]', false, NULL),
('Society & Culture', 'vocab', NULL, 'Academic', '[]', false, NULL),
('Work & Economy', 'vocab', NULL, 'Academic', '[]', false, NULL),
('Crime & Law', 'vocab', NULL, 'Academic', '[]', false, NULL),
('Government & Policy', 'vocab', NULL, 'Academic', '[]', false, NULL),
('Media & Advertising', 'vocab', NULL, 'Academic', '[]', false, NULL),
('Science & Research', 'vocab', NULL, 'Academic', '[]', false, NULL),
('Globalisation', 'vocab', NULL, 'Academic', '[]', false, NULL),
('Urbanisation', 'vocab', NULL, 'Academic', '[]', false, NULL),
('Travel & Tourism', 'vocab', NULL, 'Academic', '[]', false, NULL),
('Arts & Entertainment', 'vocab', NULL, 'Academic', '[]', false, NULL),
('Food & Agriculture', 'vocab', NULL, 'Academic', '[]', false, NULL),
('Family & Relationships', 'vocab', NULL, 'Academic', '[]', false, NULL),
('Transport', 'vocab', NULL, 'Academic', '[]', false, NULL);
