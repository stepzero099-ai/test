import { NewsArticle } from '../types';

export const INITIAL_ARTICLES: NewsArticle[] = [
  {
    id: 'art-001',
    title: 'مباحثات دبلوماسية مكثفة في جنيف لبحث وقف إطلاق النار ومسارات المساعدات الإنسانية',
    summary: 'انطلقت في جنيف جولة مفاوضات دبلوماسية جديدة بمشاركة وسطاء دوليين وإقليميين، تهدف إلى تثبيت هدنة إنسانية شاملة وتأمين ممرات آمنة لإدخال الإمدادات الإغاثية العاجلة إلى المناطق المتضررة.',
    category: 'conflicts',
    importance: 'breaking',
    publishedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    sources: [
      { id: 'aljazeera', name: 'الجزيرة', url: 'https://aljazeera.net' },
      { id: 'bbc', name: 'بي بي سي عربي', url: 'https://bbc.com/arabic' },
      { id: 'reuters', name: 'روuters عربي', url: 'https://reuters.com' }
    ],
    primarySource: { id: 'aljazeera', name: 'الجزيرة', url: 'https://aljazeera.net' },
    sourceCount: 3,
    isCorroborated: true,
    imageUrl: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1000&q=80',
    url: 'https://aljazeera.net',
    readingTimeMinutes: 2,
    aiRewritten: true,
    viewsCount: 4120,
    fullStory: {
      summary: 'تعود جذور مسار جنيف التفاوضي إلى مبادرات الوساطة الدولية المتعددة الرامية إلى منع اتساع رقعة الصراع وتوفير الحماية للمدنيين والبنى التحتية الحيوية.',
      whyItMatters: 'تسعى هذه الجولة إلى كسر الجمود وتفادي أزمة إنسانية كارثية، إضافة إلى تأثيرها المباشر على تهدئة التوترات الإقليمية والملاحة البحرية.',
      historicalContext: 'شهدت العقود الماضية محطات تفاوضية متكررة في مقر الأمم المتحدة بجنيف، حيث اعتُمدت منصة رئيسية لتقريب وجهات النظر وإبرام بروتوكولات حماية المدنيين.',
      entities: [
        {
          name: 'المبعوث الأممي الخاص',
          role: 'رئيس فريق الوساطة وتنسيق المباحثات',
          background: 'دبلوماسي مخضرم قاد جهود التهدئة في أكثر من ثلاث أزمات دولية سابقة.'
        },
        {
          name: 'منظمة الصليب الأحمر الدولية (ICRC)',
          role: 'الجهة المشرفة على الممرات الإنسانية',
          background: 'منظمة إنسانية محايدة ومستقلة مقرها جنيف تضمن إيصال المساعدات دون عوائق.'
        }
      ],
      expectedDevelopments: [
        'صدور بيان مشترك يحدد جداول زمنية للهدنة الميدانية المؤقتة',
        'بدء تسيير أول قافلة إغاثية تحت إشراف المراقبين الدوليين',
        'انعقاد جلسة طارئة لمجلس الأمن لاعتماد التفاهمات المبرمة'
      ],
      timeline: [
        { date: '2024 - الربع الأول', title: 'مبادرة الوسطاء', description: 'طرح ورقة عمل مبدئية لوقف التصعيد وفتح المعابر.' },
        { date: '2024 - منتصف العام', title: 'جولات تمهيدية في الدوحة والقاهرة', description: 'تثبيت الإطار العام ومبادئ التهدئة والتبادل.' },
        { date: 'اليوم', title: 'انطلاق محادثات جنيف الموسعة', description: 'جلوس الأطراف المعنية إلى طاولة التفاوض المباشر برعاية أممية.' }
      ],
      wikipediaSources: [
        {
          title: 'مقر الأمم المتحدة في جنيف',
          extract: 'مقر الأمم المتحدة في جنيف هو ثاني أكبر مراكز الأمم المتحدة بعد المقر الرئيسي في نيويورك، ويقع في قصر الأمم بسويسرا.',
          url: 'https://ar.wikipedia.org/wiki/قصر_الأمم'
        }
      ],
      relatedArchiveIds: []
    }
  },
  {
    id: 'art-002',
    title: 'البنوك المركزية العالمية تلمح لخفض جديد في أسعار الفائدة مع تباطؤ معدلات التضخم',
    summary: 'أشارت مؤشرات اقتصادية صادرة عن البنك المركزي الأوروبي ومجلس الاحتياطي الفيدرالي إلى احتمالية خفض تدريجي لأسعار الفائدة لدعم النمو الاقتصادي، بعد تسجيل تراجع مستمر في مؤشرات أسعار المستهلكين.',
    category: 'economy',
    importance: 'important',
    publishedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    sources: [
      { id: 'skynews', name: 'سكاي نيوز عربية', url: 'https://skynewsarabia.com' },
      { id: 'france24', name: 'فرانس 24', url: 'https://france24.com/ar' }
    ],
    primarySource: { id: 'skynews', name: 'سكاي نيوز عربية', url: 'https://skynewsarabia.com' },
    sourceCount: 2,
    isCorroborated: true,
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1000&q=80',
    url: 'https://skynewsarabia.com',
    readingTimeMinutes: 3,
    aiRewritten: true,
    viewsCount: 2890,
    fullStory: {
      summary: 'جاءت هذه التطورات بعد دورة تشديد نقدي تاريخية بدأت في 2022 للسيطرة على موجات التضخم التي أعقبت أزمة سلاسل الإمداد العالمية.',
      whyItMatters: 'يؤثر خفض الفائدة بصورة فورية على كلفة القروض للأفراد والشركات، وينعش تدفقات الاستثمار في أسواق الأسهم والعملات الرقمية والعقارات.',
      historicalContext: 'مر الاقتصاد العالمي على مدار السنوات الثلاث الماضية بأعلى مستويات فائدة منذ أكثر من 15 عاماً بهدف كبح التضخم دون إدخال الاقتصاد في ركود.',
      entities: [
        {
          name: 'الاحتياطي الفيدرالي الأمريكي',
          role: 'البنك المركزي للولايات المتحدة والموجه للسياسة النقدية الدولية',
          background: 'الهيئة النقدية المسؤولة عن تحديد سعر الفائدة المرجعي للدولار.'
        }
      ],
      expectedDevelopments: [
        'انعقاد اجتماع لجنة السوق المفتوحة لإقرار نسبة الخفض المستهدفة',
        'استجابة أسواق الأسهم العالمية بمكاسب للمؤشرات الرئيسية',
        'تعديل البنوك التجارية لفوائد القروض الاستهلاكية والعقارية'
      ],
      timeline: [
        { date: '2022', title: 'بدء دورة رفع الفائدة القياسية', description: 'رفع متسارع لأسعار الفائدة لمكافحة التضخم العالمي.' },
        { date: '2023', title: 'تثبيت الفائدة في القمة', description: 'فترة ترقب لتقييم أثر التشديد النقدي على أرقام الوظائف والتضخم.' },
        { date: '2024', title: 'بدء التيسير النقدي التدريجي', description: 'خفض أولي لأسعار الفائدة في ظل تراجع التضخم نحو المستهدفات.' }
      ],
      wikipediaSources: [
        {
          title: 'سعر الفائدة',
          extract: 'سعر الفائدة هو العائد على رأس المال المدفوع مقابل اقتراض النقود لفترة زمنية محددة.',
          url: 'https://ar.wikipedia.org/wiki/سعر_الفائدة'
        }
      ],
      relatedArchiveIds: []
    }
  },
  {
    id: 'art-003',
    title: 'إطلاق نموذج ذكاء اصطناعي عربي جديد متعدد الوسائط يتفوق في معالجة اللهجات الإقليمية',
    summary: 'أعلن مركز أبحاث التكنولوجيا المتقدمة عن إطلاق نموذج لغوي عربي فائق الدقة، قادر على فهم وتحليل النصوص واللهجات المحلية العربية بدقة غير مسبوقة مع دعم توليد المحتوى والبرمجة التلقائية.',
    category: 'technology',
    importance: 'normal',
    publishedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    sources: [
      { id: 'aljazeera', name: 'الجزيرة نت', url: 'https://aljazeera.net' },
      { id: 'dw', name: 'DW عربية', url: 'https://dw.com/ar' }
    ],
    primarySource: { id: 'aljazeera', name: 'الجزيرة نت', url: 'https://aljazeera.net' },
    sourceCount: 2,
    isCorroborated: true,
    imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1000&q=80',
    url: 'https://aljazeera.net',
    readingTimeMinutes: 2,
    aiRewritten: true,
    viewsCount: 1980
  },
  {
    id: 'art-004',
    title: 'قمة مناخية مصغرة تعتمد خطة تمويل طارئة لدعم مشاريع الطاقة الشمسية في الشرق الأوسط',
    summary: 'اختتمت القمة المناخية الإقليمية أعمالها بالموافقة على حزمة تمويلات خضراء بقيمة 12 مليار دولار لتعزيز مزارع الطاقة المتجددة ومحطات تحلية المياه بالطاقة النظيفة.',
    category: 'politics',
    importance: 'normal',
    publishedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    sources: [
      { id: 'bbc', name: 'بي بي سي عربي', url: 'https://bbc.com/arabic' }
    ],
    primarySource: { id: 'bbc', name: 'بي بي سي عربي', url: 'https://bbc.com/arabic' },
    sourceCount: 1,
    isCorroborated: false,
    imageUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1000&q=80',
    url: 'https://bbc.com/arabic',
    readingTimeMinutes: 2,
    aiRewritten: true,
    viewsCount: 1240
  },
  {
    id: 'art-005',
    title: 'الأهلي المصري يتأهل لنهائي دوري أبطال أفريقيا بعد مباراة مثيرة ضد الترجي التونسي',
    summary: 'حسم النادي الأهلي بطاقة العبور إلى المباراة النهائية للبطولة القارية بعد تغلبه على ضيفه الترجي في لقاء الإياب وسط حضور جماهيري غفير في استاد القاهرة الدولي.',
    category: 'sports',
    importance: 'important',
    publishedAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    sources: [
      { id: 'aljazeera', name: 'الجزيرة رياضة', url: 'https://aljazeera.net' },
      { id: 'skynews', name: 'سكاي نيوز عربية', url: 'https://skynewsarabia.com' }
    ],
    primarySource: { id: 'aljazeera', name: 'الجزيرة رياضة', url: 'https://aljazeera.net' },
    sourceCount: 2,
    isCorroborated: true,
    imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1000&q=80',
    url: 'https://aljazeera.net',
    readingTimeMinutes: 2,
    aiRewritten: true,
    viewsCount: 5320
  },
  {
    id: 'art-006',
    title: 'دراسة طبية حديثة تكشف فوائد النظام الغذائي المتوسطي في تعزيز صحة الدماغ والذاكرة',
    summary: 'أكدت دراسة سريرية مطولة شملت 10 آلاف مشارك أن الالتزام بالأطعمة الغنية بزيت الزيتون والخضروات والمكسرات يقلل مخاطر التدهور الإدراكي بنسبة تتجاوز 30%.',
    category: 'health',
    importance: 'normal',
    publishedAt: new Date(Date.now() - 1000 * 60 * 320).toISOString(),
    sources: [
      { id: 'dw', name: 'DW عربية', url: 'https://dw.com/ar' }
    ],
    primarySource: { id: 'dw', name: 'DW عربية', url: 'https://dw.com/ar' },
    sourceCount: 1,
    isCorroborated: false,
    imageUrl: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1000&q=80',
    url: 'https://dw.com/ar',
    readingTimeMinutes: 2,
    aiRewritten: true,
    viewsCount: 1650
  }
];
