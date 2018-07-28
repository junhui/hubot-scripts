// Description:
//   Hubot picks random emojis.

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot emoji me - Returns a random emoji
//   hubot emoji spin me - Spin the emoji slots
//   hubot emoji card me - Returns a random card against humanity with emoji

// Author:
//   sandbochs
var black_cards, card_emoji, emoji, includes, lose_responses, random_emoji, random_index, spin_emoji, win_responses;

emoji = "bowtie,smile,laughing,blush,smiley,relaxed,smirk,heart_eyes,kissing_heart,kissing_closed_eyes,flushed,relieved,satisfied,grin,wink,stuck_out_tongue_winking_eye,stuck_out_tongue_closed_eyes,grinning,kissing,kissing_smiling_eyes,stuck_out_tongue,sleeping,worried,frowning,anguished,open_mouth,grimacing,confused,hushed,expressionless,unamused,sweat_smile,sweat,disappointed_relieved,weary,pensive,disappointed,confounded,fearful,cold_sweat,persevere,cry,sob,joy,astonished,scream,neckbeard,tired_face,angry,rage,triumph,sleepy,yum,mask,sunglasses,dizzy_face,imp,smiling_imp,neutral_face,no_mouth,innocent,alien,yellow_heart,blue_heart,purple_heart,heart,green_heart,broken_heart,heartbeat,heartpulse,two_hearts,revolving_hearts,cupid,sparkling_heart,sparkles,star,star2,dizzy,boom,collision,anger,exclamation,question,grey_exclamation,grey_question,zzz,dash,sweat_drops,notes,musical_note,fire,hankey,poop,shit,+1,thumbsup,-1,thumbsdown,ok_hand,punch,facepunch,fist,v,wave,hand,open_hands,point_up,point_down,point_left,point_right,raised_hands,pray,point_up_2,clap,muscle,metal,fu,walking,runner,running,couple,family,two_men_holding_hands,two_women_holding_hands,dancer,dancers,ok_woman,no_good,information_desk_person,raised_hand,bride_with_veil,person_with_pouting_face,person_frowning,bow,couplekiss,couple_with_heart,massage,haircut,nail_care,boy,girl,woman,man,baby,older_woman,older_man,person_with_blond_hair,man_with_gua_pi_mao,man_with_turban,construction_worker,cop,angel,princess,smiley_cat,smile_cat,heart_eyes_cat,kissing_cat,smirk_cat,scream_cat,crying_cat_face,joy_cat,pouting_cat,japanese_ogre,japanese_goblin,see_no_evil,hear_no_evil,speak_no_evil,guardsman,skull,feet,lips,kiss,droplet,ear,eyes,nose,tongue,love_letter,bust_in_silhouette,busts_in_silhouette,speech_balloon,thought_balloon,feelsgood,finnadie,goberserk,godmode,hurtrealbad,rage1,rage2,rage3,rage4,suspect,trollface,sunny,umbrella,cloud,snowflake,snowman,zap,cyclone,foggy,ocean,cat,dog,mouse,hamster,rabbit,wolf,frog,tiger,koala,bear,pig,pig_nose,cow,boar,monkey_face,monkey,horse,racehorse,camel,sheep,elephant,panda_face,snake,bird,baby_chick,hatched_chick,hatching_chick,chicken,penguin,turtle,bug,honeybee,ant,beetle,snail,octopus,tropical_fish,fish,whale,whale2,dolphin,cow2,ram,rat,water_buffalo,tiger2,rabbit2,dragon,goat,rooster,dog2,pig2,mouse2,ox,dragon_face,blowfish,crocodile,dromedary_camel,leopard,cat2,poodle,paw_prints,bouquet,cherry_blossom,tulip,four_leaf_clover,rose,sunflower,hibiscus,maple_leaf,leaves,fallen_leaf,herb,mushroom,cactus,palm_tree,evergreen_tree,deciduous_tree,chestnut,seedling,blossom,ear_of_rice,shell,globe_with_meridians,sun_with_face,full_moon_with_face,new_moon_with_face,new_moon,waxing_crescent_moon,first_quarter_moon,waxing_gibbous_moon,full_moon,waning_gibbous_moon,last_quarter_moon,waning_crescent_moon,last_quarter_moon_with_face,first_quarter_moon_with_face,moon,earth_africa,earth_americas,earth_asia,volcano,milky_way,partly_sunny,octocat,squirrel,bamboo,gift_heart,dolls,school_satchel,mortar_board,flags,fireworks,sparkler,wind_chime,rice_scene,jack_o_lantern,ghost,santa,christmas_tree,gift,bell,no_bell,tanabata_tree,tada,confetti_ball,balloon,crystal_ball,cd,dvd,floppy_disk,camera,video_camera,movie_camera,computer,tv,iphone,phone,telephone,telephone_receiver,pager,fax,minidisc,vhs,sound,speaker,mute,loudspeaker,mega,hourglass,hourglass_flowing_sand,alarm_clock,watch,radio,satellite,loop,mag,mag_right,unlock,lock,lock_with_ink_pen,closed_lock_with_key,key,bulb,flashlight,high_brightness,low_brightness,electric_plug,battery,calling,email,mailbox,postbox,bath,bathtub,shower,toilet,wrench,nut_and_bolt,hammer,seat,moneybag,yen,dollar,pound,euro,credit_card,money_with_wings,e-mail,inbox_tray,outbox_tray,envelope,incoming_envelope,postal_horn,mailbox_closed,mailbox_with_mail,mailbox_with_no_mail,door,smoking,bomb,gun,hocho,pill,syringe,page_facing_up,page_with_curl,bookmark_tabs,bar_chart,chart_with_upwards_trend,chart_with_downwards_trend,scroll,clipboard,calendar,date,card_index,file_folder,open_file_folder,scissors,pushpin,paperclip,black_nib,pencil2,straight_ruler,triangular_ruler,closed_book,green_book,blue_book,orange_book,notebook,notebook_with_decorative_cover,ledger,books,bookmark,name_badge,microscope,telescope,newspaper,football,basketball,soccer,baseball,tennis,8ball,rugby_football,bowling,golf,mountain_bicyclist,bicyclist,horse_racing,snowboarder,swimmer,surfer,ski,spades,hearts,clubs,diamonds,gem,ring,trophy,musical_score,musical_keyboard,violin,space_invader,video_game,black_joker,flower_playing_cards,game_die,dart,mahjong,clapper,memo,pencil,book,art,microphone,headphones,trumpet,saxophone,guitar,shoe,sandal,high_heel,lipstick,boot,shirt,tshirt,necktie,womans_clothes,dress,running_shirt_with_sash,jeans,kimono,bikini,ribbon,tophat,crown,womans_hat,mans_shoe,closed_umbrella,briefcase,handbag,pouch,purse,eyeglasses,fishing_pole_and_fish,coffee,tea,sake,baby_bottle,beer,beers,cocktail,tropical_drink,wine_glass,fork_and_knife,pizza,hamburger,fries,poultry_leg,meat_on_bone,spaghetti,curry,fried_shrimp,bento,sushi,fish_cake,rice_ball,rice_cracker,rice,ramen,stew,oden,dango,egg,bread,doughnut,custard,icecream,ice_cream,shaved_ice,birthday,cake,cookie,chocolate_bar,candy,lollipop,honey_pot,apple,green_apple,tangerine,lemon,cherries,grapes,watermelon,strawberry,peach,melon,banana,pear,pineapple,sweet_potato,eggplant,tomato,corn,house,house_with_garden,school,office,post_office,hospital,bank,convenience_store,love_hotel,hotel,wedding,church,department_store,european_post_office,city_sunrise,city_sunset,japanese_castle,european_castle,tent,factory,tokyo_tower,japan,mount_fuji,sunrise_over_mountains,sunrise,stars,statue_of_liberty,bridge_at_night,carousel_horse,rainbow,ferris_wheel,fountain,roller_coaster,ship,speedboat,boat,sailboat,rowboat,anchor,rocket,airplane,helicopter,steam_locomotive,tram,mountain_railway,bike,aerial_tramway,suspension_railway,mountain_cableway,tractor,blue_car,oncoming_automobile,car,red_car,taxi,oncoming_taxi,articulated_lorry,bus,oncoming_bus,rotating_light,police_car,oncoming_police_car,fire_engine,ambulance,minibus,truck,train,station,train2,bullettrain_front,bullettrain_side,light_rail,monorail,railway_car,trolleybus,ticket,fuelpump,vertical_traffic_light,traffic_light,warning,construction,beginner,atm,slot_machine,busstop,barber,hotsprings,checkered_flag,crossed_flags,izakaya_lantern,moyai,circus_tent,performing_arts,round_pushpin,triangular_flag_on_post,jp,kr,cn,us,fr,es,it,ru,gb,uk,de".split(',');

lose_responses = ['You lose!'];

win_responses = ['You win!'];

black_cards = "TSA guidelines now prohibit __________ on airplanes.<>It's a pity that kids these days are all getting involved with __________.<>In 1,000 years, when paper money is but a distant memory, __________ will be our currency.<>Major League Baseball has banned __________ for giving players an unfair advantage.<>What is Batman's guilty pleasure?<>Next from J.K. Rowling: Harry Potter and the Chamber of __________.<>I'm sorry, Professor, but I couldn't complete my homework because of __________.<>What did I bring back from Mexico?<>__________? There's an app for that.<>Betcha can't have just one!<>What's my anti-drug?<>While the United States raced the Soviet Union to the moon, the Mexican government funneled millions of pesos into research on __________.<>In the new Disney Channel Original Movie, Hannah Montana struggles with __________ for the first time.<>What's my secret power?<>What's the new fad diet?<>What did Vin Diesel eat for dinner?<>When Pharaoh remained unmoved, Moses called down a Plague of __________.<>How am I maintaining my relationship status?<>What's the crustiest?<>When I'm in prison, I'll have __________ smuggled in.<>After Hurricane Katrina, Sean Penn brought __________ to the people of New Orleans.<>Instead of coal, Santa now gives the bad children __________.<>Life was difficult for cavemen before __________.<>What's Teach for America using to inspire inner city students to succeed?<>Who stole the cookies from the cookie jar?<>In Michael Jackson's final moments, he thought about __________.<>White people like __________.<>Why do I hurt all over?<>A romantic candlelit dinner would be incomplete without __________.<>What will I bring back in time to convince people that I am a powerful wizard?<>BILLY MAYS HERE FOR __________.<>The class field trip was completely ruined by __________.<>What's a girl's best friend?<>I wish I hadn't lost the instruction manual for __________.<>When I am President of the United States, I will create the Department of __________.<>What are my parents hiding from me?<>What never fails to liven up the party?<>What gets better with age?<>__________: good to the last drop.<>I got 99 problems but __________ ain't one.<>It's a trap!<>MTV's new reality show features eight washed-up celebrities living with __________.<>What would grandma find disturbing, yet oddly charming?<>What's the most emo?<>During sex, I like to think about __________.<>What ended my last relationship?<>What's that sound?<>__________. That's how I want to die.<>Why am I sticky?<>What's the next Happy MealÂ® toy?<>What's there a ton of in heaven?<>I do not know with what weapons World War III will be fought, but World War IV will be fought with __________.<>What will always get you laid?<>__________: kid tested, mother approved.<>Why can't I sleep at night?<>What's that smell?<>What helps Obama unwind?<>This is the way the world ends \ This is the way the world ends \ Not with a bang but with __________.<>Coming to Broadway this season, __________: The Musical.<>Anthropologists have recently discovered a primitive tribe that worships __________.<>But before I kill you, Mr. Bond, I must show you __________.<>Studies show that lab rats navigate mazes 50% faster after being exposed to __________.<>Due to a PR fiasco, Walmart no longer offers __________.<>When I am a billionaire, I shall erect a 50-foot statue to commemorate __________.<>In an attempt to reach a wider audience, the Smithsonian Museum of Natural History has opened an interactive exhibit on __________.<>War! What is it good for?<>What gives me uncontrollable gas?<>What do old people smell like?<>Sorry everyone, I just __________.<>Alternative medicine is now embracing the curative powers of __________.<>The U.S. has begun airdropping __________ to the children of Afghanistan.<>What does Dick Cheney prefer?<>During Picasso's often-overlooked Brown Period, he produced hundreds of paintings of __________.<>What don't you want to find in your Chinese food?<>I drink to forget __________.<>TSA guidelines now prohibit __________ on airplanes.<>It's a pity that kids these days are all getting involved with __________.<>In 1,000 years, when paper money is but a distant memory, __________ will be our currency.<>Major League Baseball has banned __________ for giving players an unfair advantage.<>What is Batman's guilty pleasure?<>Next from J.K. Rowling: Harry Potter and the Chamber of __________.<>I'm sorry, Professor, but I couldn't complete my homework because of __________.<>What did I bring back from Mexico?<>__________? There's an app for that.<>__________. Betcha can't have just one!<>What's my anti-drug?<>While the United States raced the Soviet Union to the moon, the Mexican government funneled millions of pesos into research on __________.<>In the new Disney Channel Original Movie, Hannah Montana struggles with __________ for the first time. <>What's my secret power?<>What's the new fad diet?<>What did Vin Diesel eat for dinner?<>When Pharaoh remained unmoved, Moses called down a Plague of __________.<>How am I maintaining my relationship status?<>What's the crustiest?<>In L.A. County Jail, word is you can trade 200 cigarettes for __________.<>After the earthquake, Sean Penn brought __________ to the people of Haiti.<>Instead of coal, Santa now gives the bad children __________.<>Life for American Indians was forever changed when the White Man introduced them to __________.<>What's Teach for America using to inspire inner city students to succeed?<>Maybe she's born with it. Maybe it's __________.<>In Michael Jackson's final moments, he thought about __________.<>White people like __________.<>Why do I hurt all over?<>A romantic, candlelit dinner would be incomplete without __________.<>What will I bring back in time to convince people that I am a powerful wizard?<>BILLY MAYS HERE FOR __________.<>The class field trip was completely ruined by __________.<>What's a girl's best friend?<>Dear Abby, I'm having some trouble with __________ and would like your advice.<>When I am President of the United States, I will create the Department of __________.<>What are my parents hiding from me?<>What never fails to liven up the party?<>What gets better with age?<>__________: Good to the last drop.<>I got 99 problems but __________ ain't one.<>__________. It's a trap!<>MTV's new reality show features eight washed-up celebrities living with __________.<>What would grandma find disturbing, yet oddly charming?<>What's the most emo?<>During sex, I like to think about __________.<>What ended my last relationship?<>What's that sound?<>__________. That's how I want to die.<>Why am I sticky?<>What's the next Happy Meal toy?<>What's there a ton of in heaven?<>I do not know with what weapons World War III will be fought, but World War IV will be fought with __________.<>What will always get you laid?<>__________: Kid-tested, mother-approved.<>Why can't I sleep at night?<>What's that smell?<>What helps Obama unwind?<>This is the way the world ends / This is the way the world ends / Not with a bang but with __________.<>Coming to Broadway this season, __________: The Musical.<>Anthropologists have recently discovered a primitive tribe that worships __________.<>But before I kill you, Mr. Bond, I must show you __________.<>Studies show that lab rats navigate mazes 50% faster after being exposed to __________.<>Next on ESPN2: The World Series of __________.<>When I am a billionaire, I shall erect a 50-foot statue to commemorate __________.<>In an attempt to reach a wider audience, the Smithsonian Museum of Natural History has opened an interactive exhibit on __________.<>War! What is it good for?<>What gives me uncontrollable gas?<>What do old people smell like?<>What am I giving up for Lent?<>Alternative medicine is now embracing the curative powers of __________.<>What did the US airdrop to the children of Afghanistan?<>What does Dick Cheney prefer?<>During Picasso's often-overlooked Brown Period, he produced hundreds of paintings of __________.<>What don't you want to find in your Chinese food?<>I drink to forget __________.<>__________. High five, bro.<>He who controls __________ controls the world.<>The CIA now interrogates enemy agents by repeatedly subjecting them to __________.<>In Rome, there are whisperings that the Vatican has a secret room devoted to __________.<>Science will never explain the origin of __________.<>When all else fails, I can always masturbate to __________.<>I learned the hard way that you can't cheer up a grieving friend with __________.<>In its new tourism campaign, Detroit proudly proclaims that it has finally eliminated __________.<>The socialist governments of Scandinavia have declared that access to __________ is a basic human right.<>In his new self-produced album, Kanye West raps over the sounds of __________.<>What's the gift that keeps on giving?<>This season on Man vs. Wild, Bear Grylls must survive in the depths of the Amazon with only __________ and his wits. <>When I pooped, what came out of my butt?<>In the distant future, historians will agree that __________ marked the beginning of America's decline.<>What has been making life difficult at the nudist colony?<>And I would have gotten away with it, too, if it hadn't been for __________.<>What brought the orgy to a grinding halt?<>That's right, I killed __________. How, you ask? __________.<>And the Academy Award for __________ goes to __________.<>For my next trick, I will pull __________ out of __________.<>In his new summer comedy, Rob Schneider is __________ trapped in the body of __________.<>When I was tripping on acid, __________ turned into __________.<>__________ is a slippery slope that leads to __________.<>In a world ravaged by __________, our only solace is __________.<>In M. Night Shyamalan's new movie, Bruce Willis discovers that __________ had really been __________ all along.<>I never truly understood __________ until I encountered __________.<>Rumor has it that Vladimir Putin's favorite dish is __________ stuffed with __________.<>LifetimeÂ® presents __________, the story of __________.<>What's the next superhero/sidekick duo?".split('<>');

module.exports = function(robot) {
  robot.respond(/emoji( me)?$/i, function(message) {
    return message.send(random_emoji());
  });
  robot.respond(/emoji spin( me)?/i, function(message) {
    return message.send(spin_emoji());
  });
  return robot.respond(/emoji card( me)?/i, function(message) {
    return message.send(card_emoji());
  });
};

random_emoji = function(num = 1) {
  var emojis, r_emoji;
  if (num === 1) {
    return `:${emoji[random_index(emoji)]}:`;
  }
  emojis = [];
  while (emojis.length < num) {
    r_emoji = emoji[random_index(emoji)];
    if (!includes(emojis, r_emoji)) {
      emojis.push(`:${r_emoji}:`);
    }
  }
  return emojis;
};

spin_emoji = function() {
  var count, counts, i, index, len, pool, response, spin, win;
  pool = random_emoji(4);
  spin = [];
  counts = [0, 0, 0, 0];
  win = false;
  while (spin.length < 3) {
    index = random_index(pool);
    spin.push(pool[index]);
    counts[index] += 1;
  }
  for (i = 0, len = counts.length; i < len; i++) {
    count = counts[i];
    if (count === 3) {
      win = true;
    }
  }
  if (win === true) {
    response = win_responses[random_index(win_responses)];
  } else {
    response = lose_responses[random_index(lose_responses)];
  }
  return `${spin.join(' |')} : ${response}`;
};

card_emoji = function() {
  var card, i, len, replaced, word;
  replaced = false;
  card = black_cards[random_index(black_cards)].split(' ');
  for (i = 0, len = card.length; i < len; i++) {
    word = card[i];
    if (word.match(/_{10}/)) {
      card[_i] = random_emoji();
      replaced = true;
    }
  }
  if (replaced === false) {
    card.push(` ${random_emoji()}`);
  }
  return card.join(" ");
};

random_index = function(array) {
  return Math.floor(Math.random() * array.length);
};

includes = function(array, element) {
  var el, i, len;
  for (i = 0, len = array.length; i < len; i++) {
    el = array[i];
    if (el === element) {
      return true;
    }
  }
  return false;
};
