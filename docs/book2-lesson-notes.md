# Book 2 — working notes (lessons 1-12 read; authored: 1-10)

Word lists and topic summaries in our own words, taken while reading the book; used to author `web/src/content/book2.ts`.
No sentences or exercises are reproduced. Lessons 11+ are listed here for the next authoring pass.

# Book 2 — "Lessons in Arabic Language" Book 2 (Dr V. Abdur-Raheem), 223 pdf pages. pdf page == printed page for lessons.
31 lessons. Start pages: L1 5, L2 12, L3 18, L4 26, L5 30, L6 36, L7 46, L8 55, L9 59, L10 69, L11 74, L12 84, L13 91, L14 95,
L15 103, L16 109, L17 119, L18 127, L19 133, L20 138, L21 144, L22 153, L23 154, L24 161, L25 167, L26 173, L27 180, L28 193,
L29 205, L30 213, L31 218. Index pdf 221-223. Intro (مقدمة) p3: teacher method, 4 steps. Each lesson: dialogue/text, تمارين, الكلمات الجديدة box.

## Topics (from the index)
1 إنّ and some sisters (kaanna?), ذو, مائة/ألف (100/1000)           2 ليس
3 comparative/superlative اسم التفضيل, كأنّ, لكنّ, compound numbers 11-19 with masc counted, ordinals, أليس كذلك؟, أيّها
4 past verb attached to some pronouns, لأنّ, نعم وبلى                 5 الفاعل والمفعول به
6 past verb + 2nd-person pronouns, some accusative pronoun suffixes, أظنّ, compound number with fem, تأنيث جوعان وجمعه, لَمَّة, هات
7 past verb → 2nd person pl. (masc/fem), كان and its predicate, suffixed accusative pronouns with فعلتم, number غشيء?? (ضم الميم وكسر التاء), ذو, fractions
8 past verb all pronouns, mustatir/baariz pronoun        9 review past + accusative suffixes, sound fem plural, taʿajjub (ما أفعله!), nida al-mudaf, أ before ال, ما istifhamiyya, الأسماء الموصولة
10 PRESENT verb with some pronouns, 4 bab of triliteral mujarrad, numbers 21-30 with masc
11 present with more pronouns, حروف الاستقبال (سـ/سوف), المصدر, أمّا, أخ لي
12 present with more pronouns, كسر همزة إنّ وفتحها, days of week names
13 present with all pronouns, raf' sign       14 الأمر (imperative)       15 لا الناهية, كاد, difference of لا/ما negations
16 يريد with pronouns, colours feminization, عمر/عمرو, ما الموصولة, آخر/أخرى, غير
17 subjunctive after أنْ, لام التعليل, منذ, يرى/ترى/أرى, يمكن, seasons    18 dropping nun of the 5 verbs for nasb, fem plural verbs, كاف التشبيه
19 لن, negating past/present/future   20 dual case endings, أحدهما والآخر   21 jussive لم ولمّا, nominal vs verbal sentence, subject/predicate, parts of speech, اللائي واللاتي
22 states of the present verb review    23 sound masc plural case endings, العقود (tens), لا negating past
24 numbers review   25 كان وما زال, five nouns (أب أخ)   26 assimilated (mithal) verbs, diminutive, af'al tafdil from doubled, المصدر
27 hollow verbs (ajwaf)  28 defective verbs (naaqis)  29 doubled verbs (muda''af), qat/abadan, af'al tafdil from طاب/لان
30 dual with past & present, dual accusative pronoun, ʾaf'aal khamsa i'raab    31 adjective agreement (النعت)

## Observations from the first pages (L1, pdf 5-8)
- Vocabulary is conversational: لعل, ذكي, ذو خلق, روبية, غالية/رخيصة, مهندس, مدرسة... Dialogue uses إنّ + attached pronouns (إنه، إنها، إنهم، إنهن، إنك، إنني).
- Present-tense verbs appear immediately in the L1 dialogue (أحبك), accusative suffix on verbs, أَمْ for choosing between two.
- From lesson 10 on the book teaches full verb paradigms (past, present marfu'/mansub/majzum, imperative, weak verbs). EXACT-FORM VERB WHITELISTS WON'T SCALE:
  need lemma + pattern -> generated paradigm.

## B2 L1 (pdf 5-11): إنّ + pronoun suffixes, ذو, أم, مائة/ألف
grammar: إنّ (with attached pronouns: إنه إنها إنهم إنهن إنك إنكِ إنكم إنكن إنني/إني إننا/إنا), ينصب الاسم ويرفع الخبر (إنّ المدرسَ جديدٌ);
 لعلّ ("perhaps": لعلك بخير); ذو / ذوو / ذات / ذوات ("possessor of": ذو خلق، ذو مال، ذو علم، ذو منارة); أ...أم... (choosing: أمن الهند أنت أم من باكستان؟);
 مائة, ألف + idafa/genitive noun (مائة رجل, ألف ريال: 100 / 1000); price: بكم هي؟ هي بمائة روبية.
box: ذكي (ج أذكياء) غبي (ج أغبياء) خلق (ج أخلاق) مائة ألف روبية (ج روبيات) متزوج عزب (ج أعزاب) يهودي (ج يهود) معجم (ج معاجم)
     دولار (ج دولارات) صفحة (ج صفحات) ناجح (ج ناجحون) غال كم (ج أكمام, sleeve)
also in text: لعل, أحبك (verb phrase "I love you", present 1s + object), أم, بخير, رخيصة/غالية, كثيرا, مهندس, التلفاز, الاختبار, ورق مسطر, قامة, علم, منارة,
     الذي خرج, الهند, باكستان, إيران, المدينة المنورة, مع أبي وأمي, مدرسات, الثانوية, إخوة, أخوات
## B2 L2 (pdf 12-17): ليس
grammar: ليس (+ باء الجر on the predicate: ليس بطالب); لست لستَ لستِ ليس ليست لستما لستم لستن ليسا ليستا ليسوا لسن لسنا; أمسلم أبوك؟ لا ليس بمسلم
box: لقاء جيب (ج جيوب) جيد نهر (ج أنهار) برقية (ج برقيات) مصرف (ج مصارف) مكتب البريد
also in text: مهندس جديد, مسرور (بلقائك), الولايات المتحدة, واشنطن, نيويورك, أنا زميلك, ابن (بلال بن حامد), متزوجات, صغار, نائم, عزب, الاختبار, ورق, الأخ (من الأخ؟)
names: هشام بلال حامد
## B2 L3 (pdf 18-25): comparative/superlative أفعل, كأنّ, لكنّ, numbers 11-20 (masc), ordinals, أليس كذلك؟
grammar: اسم التفضيل: أكثر أطول أكبر أصغر أجمل أحسن أسهل أنظف أرخص أبعد أوسع أقصر ... + من/منه/مني; أطول طالب في فصلنا (superlative + indefinite singular);
 كأنّ ("as if", كأنه أخوك); لكنّ (لكنّ حامدا أطول منه); العدد المركب 11-19: أحد عشر طالبا ... تسعة عشر, عشرون (accusative singular counted noun);
 الأول الثاني الثالث ... العاشر (ordinals; fem الأولى...); أليس كذلك؟ بلى; أيّهما (which of the two)
box: مهجع (ج مهاجع) كوكب (ج كواكب) واسع فريق (ج فرقاء) شقيق (ج أشقاء) ثمن عالم شهير شهر (ج شهور/أشهر) لاعب (ج لاعبون) الأزهر في المنام
also: جاء (verb: came; جاء أمس), أسامة, خط (handwriting), ما شاء الله, شكرا, الفتى, الشقيق, أصغر/أكبر منك, عن (بعيد عن), غرفة, نافذة, مراحيض, سرير, موز, عنب, الشمس, القمر, كسلى, عزب, قوية
## B2 L4 (pdf 26-29...): PAST verb with some pronouns, لأنّ, نعم وبلى
dialogue: ذهب / ذهبت / ذهبوا / ذهبن / ذهبتُ / ذهبتَ + رجع / رجعتُ ; أما ذهبت؟ بلى; لماذا; لأنني مريض; لا بأس; الحصة الأولى; خالي, خالتي, إخوتك أخواتك; أذهبت إلى الطبيب؟
exercises: correct verb agreement (رجعوا→رجعن), ما + past to negate (ما ذهبت), قال/قالت

## B2 L4 end (pdf 29): لأنّ = لـ + أنّ (لأنه لأنها لأنني لأنك), "أنّ" is a sister of إنّ; نعم/بلى answering questions (أذهبت؟ نعم / أما ذهبت؟ بلى)
 NO new-word box on pdf 26-29 (words come from the dialogue): الحصة (الأولى), الطبيب, خالي, خالتي, لا بأس, لماذا, بعد, أما (negative question), رجع, ذهب
## B2 L5 (pdf 30-35): الفاعل والمفعول به; past verb + object suffix
grammar: transitive past verb + subject + object (فتح حامد الباب; قرأ الطالب...); object pronoun on verb ـه ـها ـهم ـهن: فتحتُه، فتحتُها، رأيتُه، رأيتهم، كتبتها، فهمته, ما كتبتها;
 verb comes before subject and stays singular (ذهب الطلاب); questions with أ + past (أفهمت؟), negation ما + past (ما رجعوا, ما كسرته), لماذا, لأنني
verbs: فتح كسر فهم كتب قرأ غسل أكل شرب حفظ ضرب قتل دخل خرج سمع جلس ذهب رجع
box (p35): العنب الموز التين الفجر | جواب (ج أجوبة) سؤال (ج أسئلة) البقال العصا | حية (ج حيات) سمع فهم شرب
also: أجوبة, الدكان, النوافذ, الخبز, المنديل, الحية, الأذان, الساعة الثامنة. NOTE: text mentions surah names/سورة/حفظ سورة -> EXCLUDE (scripture rule); also القرآن.
## B2 L6 (pdf 36-45): past verb with 2nd-person (ت ـتِ ـتَ) + object pronouns; رأى; أظن أنّ; لِمَ; fem compound numbers 11-20
grammar: رجعتَ / رجعتِ / رجعتُ; رأيتها/رأيتهن/رأيتُه; ما + past; أظنّ أنّها ذهبت (أنّ + pronoun: أنني أنه أنها); لا أدري (I don't know);
 فرح بـ (فرح بي); زادك الله علما (du'a expression, skip); كوى (كويتها), غسلتها; خذ (imperative), هات / هاتي / هاتوا / هاتين (give me);
 العدد المركب 11-20 with FEMININE counted noun: إحدى عشرة طالبة، اثنتا عشرة، ثلاث عشرة ... تسع عشرة، عشرون; compound numbers + تمييز منصوب;
 جوعان (m) / جوعى (f) / جياع (pl.), كسلان/كسلى/كسالى, عطشان; لِمَ = لماذا; لمه
box: مجلة (ج مجلات) راكب (ج ركاب) شقة (ج شقق) عمارة (ج عمائر) سن (ج أسنان) كلمة (ج كلمات) كوى جاء | (سورة ج سور: EXCLUDE)
also: الفقه, درس, الظهر (صلاة الظهر), الخادمة, قطعة خبز, الشاي, مرة? , أين رأيت, الطبيبات, المدير/المديرة, بنت, جيدا
## B2 L7 (pdf 46-54): past verb with all you-plural (ذهبتم ذهبتن), نا (ذهبنا), كان + shibh jumla, accusative object suffix on verb (فعلتم)
dialogue: ذهبتم, لعبتم كرة القدم / كرة السلة, قرأنا الصحف, سمعتم الأخبار من الإذاعة (ج إذاعات), أسمعتموها؟ سمعناها, دخل المستشفى (دخل قبل ثلاثة أيام), آمين,
 ذو/ذات الغلاف الأحمر, الكتاب الذي كان في غرفتي (كان + prepositional phrase), أخذته / أخذتموه / أخذتها, قرأت نصفه, وجدتها (وجد), وضعتها (وضع), بحثت عنها (بحث), جلسنا عندها ثلث ساعة,
 خرجنا, مشينا (مشى) أم ذهبتن بالسيارة, السلم, الثلاجة, عصير برتقال, عطاش (ج عطشان), أبشر (imperative), الجرس (يرن الجرس - present verbs in stage directions: يقوم يفتح تدخل),
 الأسبوع الماضي, أين, بين المسجد والمدرسة, زيارة المديرة, الكنسة

## B2 L7 end (pdf 49-54)
grammar: كان + subject + prepositional predicate (كان المدرس في الفصل قبل خمس دقائق; كانت أمي في المطبخ); verb with plural pronouns أكلتم/دخلتم/فهمتم, ending م before ال takes damma (قرأتمُ القرآن) - spelling point;
 object pronoun on verb with ـتم: رأيتموه / فهمتموه / أقتلتموها؟ (و added); ذو + definite genitive: ذو الغلاف الأحمر; fractions: نصف ثلث ربع خمس سدس سبع ثمن تسع عشر
box (p54): مكنسة (ج مكانس) سلم (ج سلالم) منارة (ج منائر) | نظارة (ج نظارات) عجلة (ج عجل) لحية (لحى) | صورة (ج صور) إذاعة (ج إذاعات) عال (f. عالية) |
     ملوّن صابون البارحة | برتقال عصير صباح | كرة السلة كرة القدم نصف | مشى أخذ وضع | وجد بحث عن
verbs in L7: ذهب لعب قرأ سمع دخل خرج أخذ وجد وضع بحث مشى جلس رجع شرب فهم كتب
## B2 L8 (pdf 55-58): past verb with ALL pronouns (no dual yet): ذهب ذهبت ذهبوا ذهبن ذهبتَ ذهبتِ ذهبتم ذهبتنّ ذهبتُ ذهبنا
 + hidden (مستتر) vs visible (بارز) subject pronoun: التاء، الواو، النون، نا. NO new-word box.
## B2 L9 (pdf 59-68): review past + object pronouns, ما أفعله (wonder), نداء المضاف, آ-question before ال, ما الاستفهامية + prepositions, الذي/الذين/التي/اللاتي
grammar: object pronouns on past verb: خلقني خلقنا خلقك خلقكم خلقه خلقها; قرأناه كتبناه حفظناه فهمناه أفهمتموه؟; ما أفعله!: ما أطول هذا الرجل! ما أجمل هذه السيارة! ما أسهل هذا الدرس!;
 النداء: يا أخت حامد / يا عبد الله / يا أبا بكر; آلبحار؟ (أ + ال); مِمَّ (من+ما) بِمَ لِمَ عَمَّ; relative: الذي (m) الذين (m pl) التي (f) اللاتي (f pl);
 sound feminine plural: سيارات مجلات مدرسات
box (p68): قائمة (ج قوائم) علاقة (ج علاقات) رنّ لحظة جرس (ج أجراس) حضر خلق رفع طين معنى نار عدّة أحسنت
also: عاد (returned) جد (grandfather) الخرطوم السودان مصر اليمن دمشق سماء (ج سماوات) بحر (ج بحار) أرض نجم قمر شمس كل شيء إنسان فقط الأسماء القائمة سأل (asked) قام (stood up) رفع يده سؤال ج أسئلة
 جاؤوا حضروا ما أسهل
EXCLUDE (scripture): all quoted verses, surah names (الرحمن الحديد النبأ الفجر التين الأعراف الطلاق), آية, القرآن, إبليس, سورة, الجان; keep خلق (create) as a plain verb.

## B2 L10 (pdf 69-73): PRESENT tense (he/she/you m./I), 4 vowel patterns, numbers 21-30
text: يذهب, يرجع, يفعل, يقرأ, يسمع, يجلس, يعمل; متى؟; كم عاملا يعمل في مصنعكم؟; الساعة التاسعة إلا ربعا; والنصف; لعله يرجع متأخرا; دائما/أحيانا; مرة أخرى
grammar: present 3ms يـ (أيذهب؟), 3fs تـ (تدرس أختي), 2ms تـ (أنت تذهب), 1s أـ (أنا أذهب); negation: ما + past / لا + present (لا يكتب);
 تمييز: numbers 21-30 (واحد وعشرون طالبا ... ثلاثون طالبا); adverbs of state مبكرا / متأخرا; إلا ربعا
box (p73): دائما أحيانا مرة أخرى | عامل (ج عمّال) طول مكتب | مسافة عرض كيلومتر (ج كيلومترات) | سنتيمتر (ج سنتيمترات) متر (ج أمتار) عمل | فعل ركب ركع | سجد
also: مصنع, العصر, مهندسان (dual in text), زكريا موسى حامد, نزل, رفع, كتب/جلس/دخل/خرج/رجع/غسل/ضرب/فتح/قرأ/سأل/سمع/فهم/شرب/لعب/حفظ/أكل/كسر/قتل (present forms)
## B2 L11 (pdf 74-83) [not authored yet]: present with more pronouns (نحن؟ هم؟ هن) تدرس/أدرس/يدرسون/يدرسن/تسكنون/أسكن; في أي كلية/سنة; أعرف/تعرف; طبعا; الكليات (آداب علوم هندسة طب تجارة);
 سـ/سوف (حرف الاستقبال: سأذهب سيرجع), المصدر (دخول خروج جلوس نزول صعود ركوب رجوع), أمّا ... ف, أخ لي (أحد إخواني); verbs: درس سكن نزل عرف شكر صعد بحث مات; 
 box: درس سكن نزل صعد بحث عرف مات نسيت شكر | قريب (ج أقرباء) عنوان (ج عناوين) بطاقة رسالة (ج رسائل) ثوب (ج ثياب) محطة (ج محطات) | حلاق (ج حلاقون) مستوصف صيدلية | أرز خيل (ج خيول) قادم
## B2 L12 (pdf 84-): present with more pronouns, كسر همزة إنّ وفتحها, days of the week
