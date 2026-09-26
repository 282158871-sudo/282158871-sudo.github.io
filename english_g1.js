/* ================================================================
   一年级英语内容包（EN_G1） · v4
   ---------------------------------------------------------------
   ★ v4.225（家长反馈：英语「没有资料」—— 只有点读，看不到有多少料、也不能练）
     1. 新增「资料册」子页：四格统计（110 个词 / 78 句话 / 100 项拼读 / 10 首儿歌）
        + 四段手风琴（词汇册 14 组 · 句型册 · 拼读册 · 儿歌册），每段标着多少条，
        点开能看能听。家长一眼就知道英语这边内置了什么，不用自己加。
     2. 「单词 · 游戏」里的听音选词升级成「练习场」：
        听音选词 / 看图选词 / 中译英 / 英译中 四种玩法，
        范围可选（全部 110 词 或 单个主题），题数 5 / 10 题可选，
        做完报「答对 X / Y」，错词列出来可以「只练错的这几个」。
     3. 字母页新增「字母小测」：听字母名从四个里挑，10 题一轮。
     4. 一切都是选择题：不拼写、不背单词、不写句子；也不进「今日必做」、
        不进学情诊断（家长定的：英语先只做页面内自测）。
   ---------------------------------------------------------------
   ★ v4.182（家长反馈：点词族跳回页面顶部 + 要加职业主题）
     1. 修跳顶：词族展开/收起、切主题词组，原来走整页 refresh（=整页重绘，
        滚动位置丢失弹回顶部）；改成局部重绘（repaintCvc / repaintWord），
        页面停在原地。
     2. 主题词 13 → 14 组：新增「职业」（teacher/doctor/nurse/cook/driver/
        farmer/police/worker/singer/student），10 张新配图，0 缺图。
     3. 生活口语 61 → 66 句：新增「职业 · 想做什么」5 句
        （What do you want to be? / I want to be a teacher. …），
        跟职业卡配套，聊身边的人、聊长大想做什么。
   ---------------------------------------------------------------
   ★ v4.181（教育设计师 · 内容加厚 + 去单调）
     1. 儿歌 5 → 10 首：新增小星星 / 老麦克唐纳 / 幸福拍手歌 / 划船歌 / 公交车轮子。
     2. 主题词 6 → 13 组：新增食物 / 水果 / 衣服 / 玩具 / 天气 / 交通工具 / 动作。
     3. 词族 8 → 14 个：新增 -an -op -un -ig -et -ad。
     4. 日常听说 3 组 → 加「情绪 / 食物」场景。
     5. 拼读起步 3 → 9 词（仍是 a s t p i n 六个音内）。
     6. 视觉去单调：每组主题词一个专属配色，词卡/标签/选项不再一片蓝。
   教学主张（家长定的，别改）：
     · 一年级英语入门，核心是语感、兴趣、基本听说
     · 不背单词、不写句子、不默写、不死记硬背、不过度纠错
     · 字母要分清「字母名」和「字母音」：A 念字母名、在 apple 里发字母音
     · 自然拼读从 a s t p i n 拼出 sat / pin / tap，不教音标

   ★ v4.177 改了什么（家长反馈：零基础孩子听不懂、注释看不懂）：
     1. 儿歌每行 = [英文, 中文意思, 动作]：先念英文（磨耳朵），再念中文意思
        （家长能懂、能带着唱），动作提示一起做。
     2. 听音选词选项补中文小字；点读词卡/字母/日常句：先念英文、再念中文。
     3. 字母卡去掉音标（IPA 对家长孩子是天书，且主张本就不学音标），
        发音区分改由「点一下先念字母名、再念例词」体现。
     4. 中文意思放大、上色，不再当灰字。

   使用：
     主文件动态引入本文件 → 拿到 window.EN_G1 数据，
     再调用 window.EG1_render(el) 渲染英语页的一年级视图。
     全部朗读写在这里（页面上没有可供 play 的音频文件，
     但手机自带的英语发音足够启蒙用，离线也能读）。
     中文意思走中文发音人（lan=zh），同样走媒体通道。

   年级扩展：以后做二~六年级，复制本文件成 english_g2.js …，
   数据结构保持一致即可，主文件几乎不用改。
   ================================================================ */
window.EN_G1 = {
  v: 8, g: 1,
  /* 26 个字母：[小写, 字母名IPA, 字母音IPA, 例词, 例词中文] —— IPA 仅内部参考，卡片不显示 */
  letters: [
    ['a', '/eɪ/', '/æ/', 'apple', '苹果'],
    ['b', '/biː/', '/b/', 'ball', '球'],
    ['c', '/siː/', '/k/', 'cat', '猫'],
    ['d', '/diː/', '/d/', 'dog', '狗'],
    ['e', '/iː/', '/e/', 'egg', '鸡蛋'],
    ['f', '/ef/', '/f/', 'fish', '鱼'],
    ['g', '/dʒiː/', '/g/', 'goat', '山羊'],
    ['h', '/eɪtʃ/', '/h/', 'hat', '帽子'],
    ['i', '/aɪ/', '/ɪ/', 'ink', '墨水'],
    ['j', '/dʒeɪ/', '/dʒ/', 'jam', '果酱'],
    ['k', '/keɪ/', '/k/', 'kite', '风筝'],
    ['l', '/el/', '/l/', 'lion', '狮子'],
    ['m', '/em/', '/m/', 'moon', '月亮'],
    ['n', '/en/', '/n/', 'nose', '鼻子'],
    ['o', '/əʊ/', '/ɒ/', 'orange', '橙子'],
    ['p', '/piː/', '/p/', 'pig', '猪'],
    ['q', '/kjuː/', '/kw/', 'queen', '女王'],
    ['r', '/ɑːr/', '/r/', 'rabbit', '兔子'],
    ['s', '/es/', '/s/', 'sun', '太阳'],
    ['t', '/tiː/', '/t/', 'tiger', '老虎'],
    ['u', '/juː/', '/ʌ/', 'umbrella', '雨伞'],
    ['v', '/viː/', '/v/', 'van', '面包车'],
    ['w', '/ˈdʌbljuː/', '/w/', 'water', '水'],
    ['x', '/eks/', '/ks/', 'box', '盒子'],
    ['y', '/waɪ/', '/j/', 'yellow', '黄色'],
    ['z', '/ziː/', '/z/', 'zebra', '斑马']
  ],
  /* 自然拼读入门：只用 a s t p i n 这六个音就能拼出来的词（教学主张里的第一批） */
  first: [
    ['a', 's', 't', 'sat', '坐'],
    ['p', 'i', 'n', 'pin', '别针'],
    ['t', 'a', 'p', 'tap', '轻拍'],
    ['a', 'n', 't', 'ant', '蚂蚁'],
    ['p', 'a', 't', 'pat', '拍一拍'],
    ['s', 'i', 't', 'sit', '坐下'],
    ['t', 'i', 'p', 'tip', '尖端'],
    ['s', 'i', 'p', 'sip', '小口喝'],
    ['s', 'a', 'p', 'sap', '树汁']
  ],
  /* CVC 词族：-at / -ap / -in / -ip / -ot / -og / -en / -ug / -an / -op / -un / -ig / -et / -ad */
  cvc: [
    { f: 'at', w: [['cat', '猫'], ['hat', '帽子'], ['mat', '垫子'], ['sat', '坐'], ['bat', '球棒'], ['rat', '老鼠']] },
    { f: 'ap', w: [['cap', '鸭舌帽'], ['map', '地图'], ['tap', '轻拍'], ['nap', '打盹']] },
    { f: 'in', w: [['pin', '别针'], ['win', '赢'], ['fin', '鱼鳍'], ['tin', '锡罐']] },
    { f: 'ip', w: [['lip', '嘴唇'], ['sip', '小口喝'], ['tip', '尖端'], ['dip', '蘸']] },
    { f: 'ot', w: [['hot', '热'], ['pot', '锅'], ['cot', '小床'], ['dot', '小点']] },
    { f: 'og', w: [['dog', '狗'], ['log', '木头'], ['fog', '雾'], ['jog', '慢跑']] },
    { f: 'en', w: [['hen', '母鸡'], ['pen', '钢笔'], ['ten', '十'], ['men', '男士们']] },
    { f: 'ug', w: [['bug', '小虫'], ['mug', '马克杯'], ['rug', '地毯'], ['hug', '拥抱']] },
    { f: 'an', w: [['man', '男人'], ['pan', '平底锅'], ['fan', '风扇'], ['can', '罐头'], ['ran', '跑'], ['van', '面包车']] },
    { f: 'op', w: [['top', '顶'], ['hop', '单脚跳'], ['pop', '砰'], ['mop', '拖把'], ['cop', '警察']] },
    { f: 'un', w: [['sun', '太阳'], ['run', '跑'], ['fun', '好玩'], ['bun', '小面包'], ['tub', '浴缸']] },
    { f: 'ig', w: [['pig', '猪'], ['big', '大'], ['dig', '挖'], ['wig', '假发'], ['fig', '无花果']] },
    { f: 'et', w: [['pet', '宠物'], ['net', '网'], ['wet', '湿的'], ['jet', '喷气飞机'], ['vet', '兽医']] },
    { f: 'ad', w: [['dad', '爸爸'], ['bad', '坏'], ['mad', '生气'], ['sad', '伤心'], ['pad', '垫子']] }
  ],
  /* 主题词卡：[英文, 中文] —— 点一下先念英文、再念中文，孩子跟着哼，不考、不翻译。
     每组一个专属配色（THEME_COLORS），让不同主题一眼分得清。 */
  themes: [
    { n: '颜色', ic: 'sun', w: [['red', '红'], ['yellow', '黄'], ['blue', '蓝'], ['green', '绿'], ['black', '黑'], ['white', '白']] },
    { n: '数字', ic: 'math', w: [['one', '一'], ['two', '二'], ['three', '三'], ['four', '四'], ['five', '五'], ['six', '六'], ['seven', '七'], ['eight', '八'], ['nine', '九'], ['ten', '十']] },
    { n: '动物', ic: 'sparkle', w: [['cat', '猫'], ['dog', '狗'], ['pig', '猪'], ['duck', '鸭子'], ['bird', '鸟'], ['fish', '鱼'], ['rabbit', '兔子'], ['monkey', '猴子']] },
    { n: '文具', ic: 'pen', w: [['pen', '钢笔'], ['pencil', '铅笔'], ['book', '书'], ['bag', '书包'], ['ruler', '尺子'], ['eraser', '橡皮']] },
    { n: '身体', ic: 'home', w: [['eye', '眼睛'], ['ear', '耳朵'], ['nose', '鼻子'], ['mouth', '嘴'], ['hand', '手'], ['foot', '脚']] },
    { n: '家人', ic: 'star', w: [['mum', '妈妈'], ['dad', '爸爸'], ['grandma', '奶奶'], ['grandpa', '爷爷'], ['sister', '姐妹'], ['brother', '兄弟']] },
    { n: '食物', ic: 'sun', w: [['bread', '面包'], ['rice', '米饭'], ['egg', '鸡蛋'], ['milk', '牛奶'], ['meat', '肉'], ['cake', '蛋糕'], ['noodle', '面条'], ['soup', '汤']] },
    { n: '水果', ic: 'sun', w: [['apple', '苹果'], ['banana', '香蕉'], ['orange', '橙子'], ['pear', '梨'], ['grape', '葡萄'], ['watermelon', '西瓜'], ['strawberry', '草莓'], ['peach', '桃子']] },
    { n: '衣服', ic: 'pen', w: [['shirt', '衬衫'], ['pants', '裤子'], ['shoes', '鞋'], ['hat', '帽子'], ['dress', '连衣裙'], ['sock', '袜子'], ['coat', '外套'], ['shorts', '短裤']] },
    { n: '玩具', ic: 'star', w: [['ball', '球'], ['doll', '娃娃'], ['car', '小汽车'], ['block', '积木'], ['bear', '熊'], ['kite', '风筝'], ['toy', '玩具'], ['puzzle', '拼图']] },
    { n: '天气', ic: 'sun', w: [['sun', '太阳'], ['rain', '雨'], ['snow', '雪'], ['wind', '风'], ['cloud', '云'], ['rainbow', '彩虹'], ['sunny', '晴天'], ['storm', '暴风雨']] },
    { n: '交通工具', ic: 'math', w: [['car', '小汽车'], ['bus', '公交车'], ['bike', '自行车'], ['train', '火车'], ['boat', '船'], ['plane', '飞机'], ['taxi', '出租车'], ['ship', '轮船']] },
    { n: '动作', ic: 'sparkle', w: [['eat', '吃'], ['drink', '喝'], ['sleep', '睡觉'], ['run', '跑'], ['jump', '跳'], ['sing', '唱'], ['read', '读'], ['draw', '画'], ['walk', '走'], ['dance', '跳舞']] },
    /* v4.182 新增：职业 —— 她天天见到的人（老师、医生、司机…），配上「长大想做什么」的口语，最容易聊起来 */
    { n: '职业', ic: 'star', w: [['teacher', '老师'], ['doctor', '医生'], ['nurse', '护士'], ['cook', '厨师'], ['driver', '司机'], ['farmer', '农民'], ['police', '警察'], ['worker', '工人'], ['singer', '歌手'], ['student', '学生']] },
    /* ↓ v4.226 新增 8 组（家长：原来的词不够用，且全是名词，缺方位/时间/样子这些串句子的词） */
    { n: '学校', ic: 'pen', w: [['school', '学校'], ['classroom', '教室'], ['desk', '课桌'], ['chair', '椅子'], ['blackboard', '黑板'], ['flag', '国旗']] },
    { n: '时间', ic: 'sun', w: [['morning', '早上'], ['afternoon', '下午'], ['evening', '傍晚'], ['night', '夜晚'], ['today', '今天'], ['tomorrow', '明天']] },
    { n: '方位', ic: 'sparkle', w: [['in', '在…里面'], ['on', '在…上面'], ['under', '在…下面'], ['behind', '在…后面'], ['up', '向上'], ['down', '向下']] },
    { n: '形状', ic: 'math', w: [['circle', '圆形'], ['square', '正方形'], ['triangle', '三角形'], ['star', '星形'], ['heart', '心形']] },
    { n: '样子', ic: 'sparkle', w: [['tall', '高的'], ['short', '矮的'], ['long', '长的'], ['fast', '快的'], ['slow', '慢的'], ['good', '好的']] },
    { n: '房间', ic: 'home', w: [['bed', '床'], ['table', '桌子'], ['door', '门'], ['window', '窗户'], ['lamp', '台灯'], ['sofa', '沙发']] },
    { n: '户外', ic: 'sun', w: [['tree', '树'], ['flower', '花'], ['grass', '草'], ['river', '河'], ['hill', '小山'], ['sky', '天空']] },
    { n: '动物2', ic: 'star', w: [['cow', '奶牛'], ['horse', '马'], ['sheep', '绵羊'], ['elephant', '大象'], ['panda', '熊猫']] }
  ],
  /* 日常听说：g=分组，en=英文，zh=中文小字（让孩子知道大概），act=动作 */
  routine: [
    { g: '打招呼', en: 'Hello!', zh: '你好', act: '挥挥手' },
    { g: '打招呼', en: 'Hi!', zh: '嗨', act: '挥挥手' },
    { g: '打招呼', en: 'Good morning.', zh: '早上好', act: '笑着点头' },
    { g: '打招呼', en: 'Good afternoon.', zh: '下午好', act: '笑着点头' },
    { g: '打招呼', en: 'Good night.', zh: '晚安', act: '双手合脸做睡觉' },
    { g: '打招呼', en: 'How are you?', zh: '你好吗', act: '摊开手' },
    { g: '打招呼', en: "I'm fine, thank you.", zh: '我很好，谢谢', act: '竖大拇指' },
    { g: '打招呼', en: 'Nice to meet you.', zh: '很高兴认识你', act: '握手' },
    { g: '打招呼', en: 'Bye-bye!', zh: '再见', act: '挥手' },
    { g: '打招呼', en: 'See you tomorrow.', zh: '明天见', act: '挥手' },
    { g: '课堂指令', en: 'Stand up.', zh: '起立', act: '站起来' },
    { g: '课堂指令', en: 'Sit down.', zh: '坐下', act: '坐下来' },
    { g: '课堂指令', en: 'Come here.', zh: '过来', act: '招手' },
    { g: '课堂指令', en: 'Listen.', zh: '听', act: '手放耳边' },
    { g: '课堂指令', en: 'Look.', zh: '看', act: '指指眼睛' },
    { g: '课堂指令', en: 'Repeat, please.', zh: '请跟读', act: '拍拍手' },
    { g: '课堂指令', en: 'Put up your hand.', zh: '举手', act: '举高右手' },
    { g: '课堂指令', en: 'Be quiet.', zh: '安静', act: '手指放嘴边' },
    { g: '课堂指令', en: 'Line up.', zh: '排队', act: '站成一排' },
    { g: '课堂指令', en: "Let's play.", zh: '一起玩吧', act: '跳一下' },
    { g: '生活用语', en: "Let's go.", zh: '走吧', act: '向前迈一步' },
    { g: '生活用语', en: 'Wash your hands.', zh: '洗手', act: '搓搓手' },
    { g: '生活用语', en: 'Have some water.', zh: '喝点水', act: '做喝水动作' },
    { g: '生活用语', en: 'Thank you.', zh: '谢谢', act: '点点头' },
    { g: '生活用语', en: "You're welcome.", zh: '不客气', act: '摆摆手' },
    { g: '生活用语', en: "I'm sorry.", zh: '对不起', act: '低头致歉' },
    { g: '生活用语', en: 'Please.', zh: '请', act: '双手摊开' },
    { g: '生活用语', en: 'Excuse me.', zh: '打扰一下', act: '举下手' },
    { g: '生活用语', en: 'Yummy!', zh: '真好吃', act: '摸摸肚子' },
    { g: '生活用语', en: 'Good job!', zh: '做得好', act: '竖大拇指' },
    { g: '情绪', en: 'I am happy.', zh: '我开心', act: '笑一笑' },
    { g: '情绪', en: 'I am sad.', zh: '我难过', act: '低下头' },
    { g: '情绪', en: 'I am angry.', zh: '我生气', act: '皱眉叉腰' },
    { g: '情绪', en: 'I am tired.', zh: '我累了', act: '打哈欠' },
    { g: '情绪', en: 'I am hungry.', zh: '我饿了', act: '摸摸肚子' },
    { g: '情绪', en: 'I am sleepy.', zh: '我想睡觉', act: '双手托腮' },
    { g: '食物', en: 'I like apples.', zh: '我喜欢苹果', act: '点点头' },
    { g: '食物', en: 'Have some milk.', zh: '喝点牛奶', act: '做喝的动作' },
    { g: '食物', en: 'I want water.', zh: '我想喝水', act: '指指杯子' },
    { g: '食物', en: 'It is yummy.', zh: '真好吃', act: '摸摸肚子' },
    /* ↓ v4.181 新增：生活交流新场景（孩子真的用得上的场合，用来激发兴趣） */
    { g: '玩耍', en: "Let's play together.", zh: '一起玩吧', act: '拍拍手' },
    { g: '玩耍', en: 'Can I play?', zh: '我能一起玩吗', act: '举起手' },
    { g: '玩耍', en: 'Your turn.', zh: '轮到你了', act: '指向对方' },
    { g: '玩耍', en: "Let's go out.", zh: '我们出去吧', act: '指向门外' },
    { g: '家人', en: 'This is my family.', zh: '这是我的家人', act: '张开手臂' },
    { g: '家人', en: 'I love my mum.', zh: '我爱妈妈', act: '抱抱自己' },
    { g: '家人', en: 'I love my dad.', zh: '我爱爸爸', act: '竖大拇指' },
    { g: '求助 · 礼貌', en: 'Can you help me?', zh: '你能帮我吗', act: '双手摊开' },
    { g: '求助 · 礼貌', en: 'Help me, please.', zh: '请帮帮我', act: '双手合十' },
    { g: '求助 · 礼貌', en: 'Thank you very much.', zh: '非常感谢', act: '鞠个躬' },
    { g: '求助 · 礼貌', en: 'After you.', zh: '你先请', act: '伸手礼让' },
    { g: '上学 · 放学', en: "Let's go to school.", zh: '去上学吧', act: '背书包动作' },
    { g: '上学 · 放学', en: "I'm ready.", zh: '我准备好了', act: '站好点点头' },
    { g: '上学 · 放学', en: 'See you later.', zh: '待会儿见', act: '挥挥手' },
    { g: '上学 · 放学', en: "I'm home!", zh: '我回来啦', act: '做推门动作' },
    { g: '天气 · 冷热', en: 'It is sunny today.', zh: '今天是晴天', act: '指指天上' },
    { g: '天气 · 冷热', en: 'It is rainy.', zh: '下雨了', act: '手指往下落' },
    { g: '天气 · 冷热', en: 'I am cold.', zh: '我觉得冷', act: '抱住手臂' },
    { g: '天气 · 冷热', en: 'I am hot.', zh: '我觉得热', act: '用手扇风' },
    { g: '睡前', en: 'Good night, mum.', zh: '晚安，妈妈', act: '双手合脸' },
    { g: '睡前', en: 'Sweet dreams.', zh: '做个好梦', act: '闭眼微笑' },
    /* ↓ v4.182 新增：职业口语 —— 跟「职业」主题卡配套，聊身边的人 + 长大想做什么（激发兴趣用） */
    { g: '职业 · 想做什么', en: 'What do you want to be?', zh: '你长大想做什么？', act: '摊开手问她' },
    { g: '职业 · 想做什么', en: 'I want to be a teacher.', zh: '我想当老师。', act: '指指自己' },
    { g: '职业 · 想做什么', en: 'My mum is a doctor.', zh: '我妈妈是医生。', act: '指指妈妈' },
    { g: '职业 · 想做什么', en: 'My dad is a driver.', zh: '我爸爸是司机。', act: '握方向盘' },
    { g: '职业 · 想做什么', en: 'A doctor helps people.', zh: '医生帮助大家。', act: '双手摊开' }
  ],
  /* 自我介绍（v4.181 新增 · 对标人教 PEP 三上 Unit 1「Hello」）：
     先把这些句子听熟，将来三年级正式学到这一单元时，就是"复习"而不是"新东西"。
     名字用化名 Lili（不填孩子真名，保护隐私）；想换成她自己的名字，改这一处就行。 */
  intro: [
    { en: "Hello! I'm Lili.", zh: '你好！我是丽丽。', tip: '第一次见面：先打招呼，再报名字' },
    { en: 'My name is Lili.', zh: '我的名字叫丽丽。', tip: '别人问你叫什么，就这么答' },
    { en: "What's your name?", zh: '你叫什么名字？', tip: '也可以反过来问别人' },
    { en: "I'm seven years old.", zh: '我七岁了。', tip: '说自己的年龄' },
    { en: 'How old are you?', zh: '你几岁了？', tip: '问别人年龄' },
    { en: "I'm a pupil.", zh: '我是一名小学生。', tip: '说自己的身份' },
    { en: 'I like apples.', zh: '我喜欢苹果。', tip: '说喜欢什么' },
    { en: 'I like red.', zh: '我喜欢红色。', tip: '说喜欢的颜色' },
    { en: 'This is my mum.', zh: '这是我妈妈。', tip: '介绍家人' },
    { en: 'This is my dad.', zh: '这是我爸爸。', tip: '介绍家人' },
    { en: "I'm from China.", zh: '我来自中国。', tip: '说自己是哪里人' },
    { en: 'Nice to meet you!', zh: '很高兴认识你！', tip: '认识新朋友时说' }
  ],
  /* 儿歌：每行 = [英文, 中文意思, 动作]。
     播放时先念英文（磨耳朵），再念中文意思（家长能懂、能教），动作提示一起做。 */
  songs: [
    { t: 'Hello Song', s: '早上见面打招呼的时候唱', l: [
      ['Hello, hello, how are you?', '你好，你好，你好吗？', '挥挥手'],
      ['I am fine, I am fine.', '我很好，我很好。', '点点头'],
      ['Thank you, thank you very much.', '谢谢你，非常感谢。', '鞠个躬']
    ] },
    { t: 'Head, Shoulders, Knees and Toes', s: '认识身体部位，边唱边摸', l: [
      ['Head, shoulders, knees and toes.', '头、肩膀、膝盖和脚趾。', '依次摸头、肩膀、膝盖、脚趾'],
      ['Knees and toes.', '膝盖和脚趾。', '摸摸膝盖和脚趾'],
      ['Head, shoulders, knees and toes.', '头、肩膀、膝盖和脚趾。', '再摸一遍'],
      ['Eyes and ears and mouth and nose.', '眼睛、耳朵、嘴和鼻子。', '依次指眼睛、耳朵、嘴、鼻子']
    ] },
    { t: 'ABC Song', s: '学完 26 个字母后连起来唱', l: [
      ['A B C D E F G,', 'A B C D E F G（字母名）', '一个字母拍一下手'],
      ['H I J K L M N O P,', 'H I J K L M N O P', '继续拍手'],
      ['Q R S, T U V,', 'Q R S，T U V', '继续拍手'],
      ['W X, Y and Z.', 'W X，Y 和 Z', '继续拍手'],
      ['Now I know my A B C!', '现在我会我的 ABC 啦！', '双手举高']
    ] },
    { t: 'Ten Little Fingers', s: '数数 1 到 10', l: [
      ['One little, two little, three little fingers.', '一根、两根、三根小手指。', '伸出三根手指'],
      ['Four little, five little, six little fingers.', '四根、五根、六根小手指。', '伸出六根手指'],
      ['Seven little, eight little, nine little fingers.', '七根、八根、九根小手指。', '伸出九根手指'],
      ['Ten little fingers on my hands.', '我手上有十根小手指。', '两只手全部张开']
    ] },
    { t: 'Rain, Rain, Go Away', s: '下雨天想出去玩的时候唱', l: [
      ['Rain, rain, go away.', '雨、雨，快走开。', '挥手赶雨'],
      ['Come again another day.', '改天再来吧。', '招招手'],
      ['Little children want to play.', '小朋友想出去玩。', '原地蹦两下'],
      ['Rain, rain, go away.', '雨、雨，快走开。', '再挥手赶雨']
    ] },
    { t: 'Twinkle, Twinkle, Little Star', s: '睡前或看星星的时候唱', l: [
      ['Twinkle, twinkle, little star.', '一闪一闪，小星星。', '伸出手指做星星闪'],
      ['How I wonder what you are.', '我想知道你是什么。', '歪着头想'],
      ['Up above the world so high,', '高高地挂在天上面，', '把手举高'],
      ['Like a diamond in the sky.', '像颗钻石在天上。', '双手比钻石形']
    ] },
    { t: 'Old MacDonald Had a Farm', s: '认识农场动物和叫声', l: [
      ['Old MacDonald had a farm.', '老麦克唐纳有个农场。', '拍拍肚子'],
      ['E - I - E - I - O.', '咿—呀—咿—呀—喔。', '摇摇手'],
      ['And on his farm he had a cow.', '农场里有一头奶牛。', '双手比牛角'],
      ['With a moo moo here,', '这儿哞哞叫，', '指指这边'],
      ['And a moo moo there.', '那儿哞哞叫。', '指指那边']
    ] },
    { t: 'If You Are Happy', s: '开心的时候边唱边做动作', l: [
      ['If you are happy and you know it, clap your hands.', '如果感到幸福你就拍拍手。', '拍拍手'],
      ['If you are happy and you know it, stomp your feet.', '如果感到幸福你就跺跺脚。', '跺跺脚'],
      ['If you are happy and you know it, shout "Hurray!"', '如果感到幸福你就喊"好耶！"', '举手喊']
    ] },
    { t: 'Row, Row, Row Your Boat', s: '假装划小船的时候唱', l: [
      ['Row, row, row your boat,', '划，划，划你的小船，', '做划船动作'],
      ['Gently down the stream.', '轻轻地顺流而下。', '手往前划'],
      ['Merrily, merrily, merrily,', '欢快地，欢快地，', '笑着摇'],
      ['Life is but a dream.', '生活就像一场梦。', '双手托腮']
    ] },
    { t: 'The Wheels on the Bus', s: '坐车出门的时候唱', l: [
      ['The wheels on the bus go round and round,', '公交车的轮子转啊转，', '双手画圈'],
      ['Round and round, round and round.', '转啊转，转啊转。', '继续画圈'],
      ['The wipers on the bus go swish, swish, swish,', '公交车的雨刷唰唰唰，', '手左右摆'],
      ['The horn on the bus goes beep, beep, beep.', '公交车的喇叭嘀嘀嘀。', '按喇叭']
    ] }
  ],

  /* 主题词配图库（v4.181 新增）：key=英文小写，value=内联 SVG 字符串（100x100 扁平可爱风）。
     颜色词=色块、数字词=点数、其余=简笔物体。渲染按词查，查不到则该词不插图。 */
  pics: (function () {
    function psvg(inner, bg) {
      return '<svg viewBox="0 0 100 100" class="eg1-pic" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">' +
        (bg ? '<rect width="100" height="100" rx="20" fill="' + bg + '"/>' : '') + inner + '</svg>';
    }
    function numPic(n) {
      var map = {
        1: [[50,50]], 2: [[34,50],[66,50]], 3: [[50,28],[34,72],[66,72]],
        4: [[34,34],[66,34],[34,66],[66,66]], 5: [[34,34],[66,34],[34,66],[66,66],[50,50]],
        6: [[34,30],[66,30],[34,50],[66,50],[34,70],[66,70]],
        7: [[34,30],[66,30],[34,50],[66,50],[34,70],[66,70],[50,42]],
        8: [[34,28],[66,28],[34,50],[66,50],[34,72],[66,72],[50,39],[50,61]],
        9: [[34,30],[66,30],[50,30],[34,50],[66,50],[50,50],[34,70],[66,70],[50,70]],
        10: [[30,35],[46,35],[62,35],[78,35],[30,65],[46,65],[62,65],[78,65],[38,50],[70,50]]
      };
      var pts = map[n] || map[1], s = '';
      for (var i = 0; i < pts.length; i++) s += '<circle cx="' + pts[i][0] + '" cy="' + pts[i][1] + '" r="9" fill="#495057"/>';
      return psvg(s, '#F1F3F5');
    }
    var P = {};
    // 颜色
    P.red = psvg('<circle cx="50" cy="50" r="33" fill="#FF6B6B"/>', '#FFE3E3');
    P.yellow = psvg('<circle cx="50" cy="50" r="33" fill="#FFD43B"/>', '#FFF3BF');
    P.blue = psvg('<circle cx="50" cy="50" r="33" fill="#4DABF7"/>', '#D0EBFF');
    P.green = psvg('<circle cx="50" cy="50" r="33" fill="#51CF66"/>', '#D3F9D8');
    P.black = psvg('<circle cx="50" cy="50" r="33" fill="#343A40"/>', '#E9ECEF');
    P.white = psvg('<circle cx="50" cy="50" r="33" fill="#FFFFFF" stroke="#CED4DA" stroke-width="3"/>', '#F1F3F5');
    // 数字
    P.one = numPic(1); P.two = numPic(2); P.three = numPic(3); P.four = numPic(4); P.five = numPic(5);
    P.six = numPic(6); P.seven = numPic(7); P.eight = numPic(8); P.nine = numPic(9); P.ten = numPic(10);
    // 动物
    P.cat = psvg('<circle cx="50" cy="54" r="26" fill="#FFE0B2"/><path d="M30 34 L26 14 L42 30 Z" fill="#FFE0B2"/><path d="M70 34 L74 14 L58 30 Z" fill="#FFE0B2"/><circle cx="42" cy="52" r="3" fill="#343A40"/><circle cx="58" cy="52" r="3" fill="#343A40"/><path d="M44 62 Q50 66 56 62" stroke="#343A40" stroke-width="2" fill="none"/>');
    P.dog = psvg('<circle cx="50" cy="52" r="25" fill="#FFD8A8"/><ellipse cx="28" cy="44" rx="9" ry="16" fill="#E8A87C"/><ellipse cx="72" cy="44" rx="9" ry="16" fill="#E8A87C"/><ellipse cx="50" cy="60" rx="7" ry="5" fill="#5C3A21"/><circle cx="42" cy="48" r="3" fill="#343A40"/><circle cx="58" cy="48" r="3" fill="#343A40"/>');
    P.pig = psvg('<circle cx="50" cy="52" r="25" fill="#FFC9C9"/><ellipse cx="50" cy="59" rx="9" ry="6" fill="#FF9AA2"/><circle cx="47" cy="59" r="1.6" fill="#343A40"/><circle cx="53" cy="59" r="1.6" fill="#343A40"/><path d="M30 34 Q23 28 30 23" stroke="#FFC9C9" stroke-width="7" fill="none"/><path d="M70 34 Q77 28 70 23" stroke="#FFC9C9" stroke-width="7" fill="none"/>');
    P.duck = psvg('<ellipse cx="50" cy="58" rx="26" ry="22" fill="#FFD43B"/><circle cx="40" cy="38" r="14" fill="#FFD43B"/><path d="M26 38 L12 42 L26 46 Z" fill="#FF922B"/><circle cx="38" cy="36" r="2.6" fill="#343A40"/>');
    P.bird = psvg('<ellipse cx="48" cy="54" rx="22" ry="20" fill="#4DABF7"/><circle cx="64" cy="40" r="13" fill="#4DABF7"/><path d="M76 40 L92 38 L76 45 Z" fill="#FF922B"/><circle cx="66" cy="38" r="2.6" fill="#343A40"/><path d="M40 50 Q32 54 40 60" stroke="#1C7ED6" stroke-width="5" fill="none"/>');
    P.fish = psvg('<ellipse cx="44" cy="50" rx="26" ry="18" fill="#FF922B"/><path d="M70 50 L92 36 L92 64 Z" fill="#FF922B"/><circle cx="36" cy="46" r="3" fill="#343A40"/><path d="M30 50 Q24 50 30 50" stroke="#E8590C" stroke-width="2" fill="none"/>');
    P.rabbit = psvg('<circle cx="50" cy="56" r="22" fill="#FFFFFF" stroke="#E9ECEF" stroke-width="2"/><ellipse cx="42" cy="28" rx="7" ry="18" fill="#FFFFFF" stroke="#E9ECEF" stroke-width="2"/><ellipse cx="58" cy="28" rx="7" ry="18" fill="#FFFFFF" stroke="#E9ECEF" stroke-width="2"/><ellipse cx="42" cy="30" rx="3" ry="11" fill="#FFC9C9"/><ellipse cx="58" cy="30" rx="3" ry="11" fill="#FFC9C9"/><circle cx="43" cy="54" r="2.6" fill="#343A40"/><circle cx="57" cy="54" r="2.6" fill="#343A40"/><circle cx="50" cy="60" r="2.4" fill="#FF8FA3"/>');
    P.monkey = psvg('<circle cx="50" cy="52" r="26" fill="#A0713E"/><circle cx="22" cy="50" r="11" fill="#A0713E"/><circle cx="78" cy="50" r="11" fill="#A0713E"/><circle cx="22" cy="50" r="6" fill="#E8C9A0"/><circle cx="78" cy="50" r="6" fill="#E8C9A0"/><circle cx="50" cy="54" r="17" fill="#E8C9A0"/><circle cx="44" cy="50" r="2.6" fill="#343A40"/><circle cx="56" cy="50" r="2.6" fill="#343A40"/><path d="M46 62 Q50 65 54 62" stroke="#343A40" stroke-width="2" fill="none"/>');
    // 水果
    P.apple = psvg('<path d="M50 30 Q36 22 32 36 Q24 52 38 70 Q50 82 62 70 Q76 52 68 36 Q64 22 50 30 Z" fill="#FF6B6B"/><path d="M50 32 Q52 22 60 20" stroke="#8B5A2B" stroke-width="3" fill="none"/><path d="M58 22 Q70 18 72 28 Q62 30 58 22 Z" fill="#51CF66"/>');
    P.banana = psvg('<path d="M30 28 Q20 64 48 78 Q74 88 80 66 Q58 76 46 60 Q36 46 40 30 Z" fill="#FFD43B"/><path d="M30 28 Q26 30 30 36" stroke="#5C3A21" stroke-width="3" fill="none"/>');
    P.orange = psvg('<circle cx="50" cy="52" r="28" fill="#FF922B"/><path d="M50 24 Q50 18 54 16" stroke="#5C3A21" stroke-width="3" fill="none"/><circle cx="42" cy="46" r="4" fill="#FFB877" opacity="0.6"/><circle cx="58" cy="58" r="4" fill="#FFB877" opacity="0.6"/>');
    P.pear = psvg('<path d="M50 24 Q44 24 44 34 Q30 44 34 62 Q40 80 50 80 Q60 80 66 62 Q70 44 56 34 Q56 24 50 24 Z" fill="#A9E34B"/><path d="M50 24 Q52 16 58 14" stroke="#5C3A21" stroke-width="3" fill="none"/>');
    P.grape = psvg('<circle cx="50" cy="30" r="9" fill="#9775FA"/><circle cx="38" cy="42" r="9" fill="#9775FA"/><circle cx="62" cy="42" r="9" fill="#9775FA"/><circle cx="44" cy="54" r="9" fill="#845EF7"/><circle cx="56" cy="54" r="9" fill="#845EF7"/><circle cx="50" cy="66" r="9" fill="#7048E8"/><path d="M50 22 Q52 14 58 12" stroke="#5C3A21" stroke-width="3" fill="none"/>');
    P.watermelon = psvg('<path d="M22 64 A30 30 0 0 1 78 64 Z" fill="#51CF66"/><path d="M28 62 A24 24 0 0 1 72 62 Z" fill="#FF6B6B"/><circle cx="44" cy="56" r="2" fill="#343A40"/><circle cx="56" cy="58" r="2" fill="#343A40"/><circle cx="50" cy="50" r="2" fill="#343A40"/>');
    P.strawberry = psvg('<path d="M50 26 L66 44 Q60 76 50 80 Q40 76 34 44 Z" fill="#FF6B6B"/><path d="M40 28 L34 18 L46 26 L50 16 L54 26 L66 18 L60 28 Z" fill="#51CF66"/><circle cx="46" cy="50" r="1.6" fill="#FFE3E3"/><circle cx="54" cy="54" r="1.6" fill="#FFE3E3"/><circle cx="50" cy="62" r="1.6" fill="#FFE3E3"/>');
    P.peach = psvg('<circle cx="50" cy="54" r="28" fill="#FFB6B6"/><path d="M50 28 Q48 50 50 80" stroke="#FF8FA3" stroke-width="3" fill="none"/><path d="M50 28 Q60 20 70 26 Q58 32 50 28 Z" fill="#69DB7C"/>');
    // 食物
    P.bread = psvg('<path d="M24 56 Q24 34 50 34 Q76 34 76 56 L76 70 Q76 76 70 76 L30 76 Q24 76 24 70 Z" fill="#E8A35C"/><path d="M30 44 Q50 38 70 44" stroke="#C9824A" stroke-width="3" fill="none"/>');
    P.rice = psvg('<path d="M26 50 Q26 44 50 44 Q74 44 74 50 L70 74 Q50 80 30 74 Z" fill="#FFFFFF" stroke="#CED4DA" stroke-width="2"/><circle cx="44" cy="58" r="2.4" fill="#F1F3F5"/><circle cx="56" cy="62" r="2.4" fill="#F1F3F5"/><circle cx="50" cy="68" r="2.4" fill="#F1F3F5"/>');
    P.egg = psvg('<ellipse cx="50" cy="56" rx="26" ry="32" fill="#FFFFFF" stroke="#E9ECEF" stroke-width="2"/><circle cx="50" cy="56" r="13" fill="#FFD43B"/>');
    P.milk = psvg('<path d="M34 26 L66 26 L66 78 L34 78 Z" fill="#FFFFFF" stroke="#CED4DA" stroke-width="2"/><rect x="34" y="44" width="32" height="14" fill="#4DABF7"/><path d="M40 26 L40 18 L46 26 Z" fill="#FFFFFF" stroke="#CED4DA" stroke-width="2"/>');
    P.meat = psvg('<path d="M28 46 Q30 34 50 36 Q72 40 68 58 Q64 72 46 68 Q28 64 28 46 Z" fill="#FF9AA2"/><circle cx="30" cy="48" r="7" fill="#F1F3F5" stroke="#CED4DA" stroke-width="1.5"/>');
    P.cake = psvg('<path d="M28 64 L72 64 L68 78 L32 78 Z" fill="#FFC9C9"/><path d="M28 64 Q50 50 72 64 Z" fill="#FFE0B2"/><circle cx="50" cy="46" r="5" fill="#FF6B6B"/>');
    P.noodle = psvg('<path d="M26 50 Q26 44 50 44 Q74 44 74 50 L70 74 Q50 80 30 74 Z" fill="#FFFFFF" stroke="#CED4DA" stroke-width="2"/><path d="M34 56 Q40 50 46 56 Q52 62 58 56 Q64 50 70 56" stroke="#FFD43B" stroke-width="3" fill="none"/>');
    P.soup = psvg('<path d="M26 52 Q26 46 50 46 Q74 46 74 52 L70 70 Q50 76 30 70 Z" fill="#FFFFFF" stroke="#CED4DA" stroke-width="2"/><path d="M44 40 Q42 34 46 30" stroke="#CED4DA" stroke-width="3" fill="none"/><path d="M56 40 Q54 34 58 30" stroke="#CED4DA" stroke-width="3" fill="none"/>');
    // 文具
    P.pen = psvg('<rect x="44" y="20" width="12" height="40" rx="4" fill="#4DABF7"/><path d="M44 60 L56 60 L50 78 Z" fill="#343A40"/><rect x="44" y="16" width="12" height="8" rx="3" fill="#FFD43B"/>');
    P.pencil = psvg('<rect x="44" y="28" width="12" height="44" rx="2" fill="#FFD43B"/><path d="M44 28 L56 28 L50 14 Z" fill="#FFE0B2"/><path d="M47 18 L53 18 L50 14 Z" fill="#343A40"/><rect x="44" y="72" width="12" height="8" rx="3" fill="#FF9AA2"/>');
    P.book = psvg('<rect x="26" y="30" width="48" height="40" rx="4" fill="#FF6B6B"/><rect x="26" y="30" width="8" height="40" rx="2" fill="#C92A2A"/><path d="M40 42 L62 42 M40 50 L62 50 M40 58 L56 58" stroke="#FFFFFF" stroke-width="2" fill="none"/>');
    P.bag = psvg('<rect x="28" y="40" width="44" height="36" rx="8" fill="#4DABF7"/><path d="M40 40 Q40 26 50 26 Q60 26 60 40" stroke="#4DABF7" stroke-width="6" fill="none"/><rect x="44" y="52" width="12" height="10" rx="2" fill="#1C7ED6"/>');
    P.ruler = psvg('<rect x="22" y="42" width="56" height="16" rx="3" fill="#FFD43B" stroke="#E8A35C" stroke-width="1.5"/><path d="M28 50 L28 58 M36 42 L36 54 M44 50 L44 58 M52 42 L52 54 M60 50 L60 58 M68 42 L68 54" stroke="#868E96" stroke-width="2"/>');
    P.eraser = psvg('<rect x="32" y="40" width="36" height="20" rx="4" fill="#FF9AA2"/><rect x="32" y="40" width="36" height="10" rx="4" fill="#FFC9C9"/>');
    // 身体
    P.eye = psvg('<ellipse cx="50" cy="50" rx="30" ry="20" fill="#FFFFFF" stroke="#CED4DA" stroke-width="2"/><circle cx="50" cy="50" r="11" fill="#4DABF7"/><circle cx="50" cy="50" r="5" fill="#343A40"/><path d="M24 42 Q50 30 76 42" stroke="#343A40" stroke-width="3" fill="none"/>');
    P.ear = psvg('<path d="M50 24 Q24 24 24 50 Q24 76 50 76 Q40 70 40 50 Q40 34 50 30 Z" fill="#FFD8A8" stroke="#E8A35C" stroke-width="2"/>');
    P.nose = psvg('<path d="M50 30 Q40 30 40 48 Q40 64 50 66 Q60 64 60 48 Q60 30 50 30 Z" fill="#FFD8A8"/><circle cx="44" cy="56" r="2.4" fill="#C9824A"/><circle cx="56" cy="56" r="2.4" fill="#C9824A"/>');
    P.mouth = psvg('<path d="M28 44 Q50 40 72 44" stroke="#C9824A" stroke-width="3" fill="none"/><path d="M30 46 Q50 72 70 46 Z" fill="#FF8FA3"/>');
    P.hand = psvg('<rect x="38" y="44" width="24" height="34" rx="10" fill="#FFD8A8"/><rect x="40" y="28" width="6" height="22" rx="3" fill="#FFD8A8"/><rect x="49" y="24" width="6" height="26" rx="3" fill="#FFD8A8"/><rect x="58" y="30" width="6" height="20" rx="3" fill="#FFD8A8"/>');
    P.foot = psvg('<path d="M30 70 Q30 40 50 40 Q70 40 70 70 Z" fill="#FFD8A8"/><rect x="30" y="66" width="9" height="12" rx="4" fill="#FFD8A8"/><rect x="42" y="68" width="9" height="12" rx="4" fill="#FFD8A8"/><rect x="54" y="66" width="9" height="12" rx="4" fill="#FFD8A8"/>');
    // 家人
    P.mum = psvg('<circle cx="50" cy="50" r="24" fill="#FFD8A8"/><path d="M26 50 Q22 20 50 20 Q78 20 74 50 Q74 38 50 38 Q26 38 26 50 Z" fill="#7B4B2A"/><path d="M26 50 Q20 70 30 80 L40 70 Q30 62 34 50 Z" fill="#7B4B2A"/><path d="M74 50 Q80 70 70 80 L60 70 Q70 62 66 50 Z" fill="#7B4B2A"/><circle cx="42" cy="50" r="2.6" fill="#343A40"/><circle cx="58" cy="50" r="2.6" fill="#343A40"/><path d="M44 60 Q50 64 56 60" stroke="#C9824A" stroke-width="2" fill="none"/>');
    P.dad = psvg('<circle cx="50" cy="52" r="24" fill="#FFD8A8"/><path d="M28 44 Q30 26 50 26 Q70 26 72 44 Q60 34 50 34 Q40 34 28 44 Z" fill="#3B2A1A"/><path d="M34 66 Q50 74 66 66" stroke="#3B2A1A" stroke-width="3" fill="none"/><circle cx="42" cy="50" r="2.6" fill="#343A40"/><circle cx="58" cy="50" r="2.6" fill="#343A40"/>');
    P.grandma = psvg('<circle cx="50" cy="50" r="24" fill="#FFD8A8"/><circle cx="50" cy="20" r="8" fill="#E9ECEF"/><path d="M28 46 Q26 28 50 28 Q74 28 72 46 Q72 36 50 36 Q28 36 28 46 Z" fill="#E9ECEF"/><circle cx="40" cy="50" r="6" fill="none" stroke="#868E96" stroke-width="2"/><circle cx="60" cy="50" r="6" fill="none" stroke="#868E96" stroke-width="2"/><circle cx="42" cy="52" r="2.4" fill="#343A40"/><circle cx="58" cy="52" r="2.4" fill="#343A40"/>');
    P.grandpa = psvg('<circle cx="50" cy="50" r="24" fill="#FFD8A8"/><path d="M28 44 Q30 28 50 28 Q70 28 72 44 Q60 34 50 34 Q40 34 28 44 Z" fill="#E9ECEF"/><path d="M34 66 Q50 76 66 66" stroke="#E9ECEF" stroke-width="4" fill="none"/><circle cx="40" cy="50" r="6" fill="none" stroke="#868E96" stroke-width="2"/><circle cx="60" cy="50" r="6" fill="none" stroke="#868E96" stroke-width="2"/><circle cx="42" cy="52" r="2.4" fill="#343A40"/><circle cx="58" cy="52" r="2.4" fill="#343A40"/>');
    P.sister = psvg('<circle cx="50" cy="52" r="24" fill="#FFD8A8"/><path d="M28 46 Q26 22 50 22 Q74 22 72 46 Q72 34 50 34 Q28 34 28 46 Z" fill="#7B4B2A"/><circle cx="24" cy="54" r="6" fill="#7B4B2A"/><circle cx="76" cy="54" r="6" fill="#7B4B2A"/><circle cx="42" cy="52" r="2.6" fill="#343A40"/><circle cx="58" cy="52" r="2.6" fill="#343A40"/><path d="M44 62 Q50 66 56 62" stroke="#C9824A" stroke-width="2" fill="none"/>');
    P.brother = psvg('<circle cx="50" cy="52" r="24" fill="#FFD8A8"/><path d="M28 46 Q30 26 50 26 Q70 26 72 46 Q60 34 50 34 Q40 34 28 46 Z" fill="#3B2A1A"/><circle cx="42" cy="52" r="2.6" fill="#343A40"/><circle cx="58" cy="52" r="2.6" fill="#343A40"/><path d="M44 62 Q50 66 56 62" stroke="#C9824A" stroke-width="2" fill="none"/>');
    // 衣服
    P.shirt = psvg('<path d="M36 30 L24 38 L30 48 L38 42 L38 74 L62 74 L62 42 L70 48 L76 38 L64 30 Q50 40 36 30 Z" fill="#4DABF7"/>');
    P.pants = psvg('<path d="M34 30 L66 30 L64 74 L52 74 L50 48 L48 74 L36 74 Z" fill="#495057"/>');
    P.shoes = psvg('<path d="M28 56 Q28 48 40 48 L58 48 Q72 48 72 60 L72 66 L28 66 Z" fill="#E8590C"/><path d="M28 66 L72 66 L72 72 L28 72 Z" fill="#343A40"/>');
    P.hat = psvg('<path d="M34 50 Q34 28 50 28 Q66 28 66 50 Z" fill="#FF922B"/><rect x="24" y="50" width="52" height="8" rx="4" fill="#E8590C"/>');
    P.dress = psvg('<path d="M42 28 L58 28 L58 46 L70 76 L30 76 L42 46 Z" fill="#FF6B6B"/>');
    P.sock = psvg('<path d="M40 28 L56 28 L56 60 Q56 74 70 74 L70 64 Q70 50 56 50 L56 28 Z" fill="#FCC419"/>');
    P.coat = psvg('<path d="M36 30 L24 40 L32 50 L38 44 L38 76 L62 76 L62 44 L68 50 L76 40 L64 30 Q50 38 36 30 Z" fill="#845EF7"/><circle cx="50" cy="52" r="2.5" fill="#FFFFFF"/><circle cx="50" cy="62" r="2.5" fill="#FFFFFF"/>');
    P.shorts = psvg('<path d="M34 32 L66 32 L64 64 L52 64 L50 46 L48 64 L36 64 Z" fill="#20C997"/>');
    // 玩具（car 与交通组共用一张图，此处不重复定义）
    P.ball = psvg('<circle cx="50" cy="52" r="26" fill="#FF6B6B"/><path d="M24 52 Q50 40 76 52 M24 52 Q50 64 76 52" stroke="#FFFFFF" stroke-width="2.5" fill="none"/>');
    P.doll = psvg('<circle cx="50" cy="30" r="12" fill="#FFD8A8"/><path d="M40 24 Q50 14 60 24 Z" fill="#7B4B2A"/><path d="M38 44 Q38 42 50 42 Q62 42 62 44 L66 74 L34 74 Z" fill="#FF8FA3"/>');
    P.block = psvg('<rect x="34" y="50" width="32" height="20" rx="3" fill="#FFD43B"/><rect x="40" y="32" width="20" height="20" rx="3" fill="#69DB7C"/><rect x="44" y="16" width="14" height="18" rx="3" fill="#FF922B"/>');
    P.bear = psvg('<circle cx="50" cy="56" r="22" fill="#C9824A"/><circle cx="34" cy="40" r="9" fill="#C9824A"/><circle cx="66" cy="40" r="9" fill="#C9824A"/><circle cx="50" cy="34" r="14" fill="#E8C9A0"/><circle cx="44" cy="52" r="2.6" fill="#343A40"/><circle cx="56" cy="52" r="2.6" fill="#343A40"/>');
    P.kite = psvg('<path d="M50 20 L74 44 L50 68 L26 44 Z" fill="#FF6B6B"/><path d="M50 20 L50 68 M26 44 L74 44" stroke="#FFFFFF" stroke-width="1.5"/><path d="M50 68 Q46 78 52 84 Q48 90 54 94" stroke="#868E96" stroke-width="2" fill="none"/>');
    P.toy = psvg('<rect x="32" y="40" width="36" height="32" rx="3" fill="#FF922B"/><path d="M32 40 L68 72 M68 40 L32 72" stroke="#FFD43B" stroke-width="4"/><path d="M50 22 L58 36 L50 40 L42 36 Z" fill="#FFD43B"/>');
    P.puzzle = psvg('<path d="M30 30 H56 V44 Q56 52 64 52 Q72 52 72 44 V70 H30 Z" fill="#9775FA"/><circle cx="43" cy="37" r="4" fill="#7048E8"/>');
    // 天气
    P.sun = psvg('<circle cx="50" cy="50" r="18" fill="#FFD43B"/><path d="M50 14 V26 M50 74 V86 M14 50 H26 M74 50 H86 M24 24 L33 33 M76 24 L67 33 M24 76 L33 67 M76 76 L67 67" stroke="#FFD43B" stroke-width="4" stroke-linecap="round"/>');
    P.rain = psvg('<path d="M30 40 Q24 50 34 54 Q44 58 54 54 Q66 50 62 40 Q60 32 50 32 Q38 32 30 40 Z" fill="#CED4DA"/><path d="M38 62 L34 74 M52 62 L48 74 M64 62 L60 74" stroke="#4DABF7" stroke-width="3" stroke-linecap="round"/>');
    P.snow = psvg('<path d="M30 40 Q24 50 34 54 Q44 58 54 54 Q66 50 62 40 Q60 32 50 32 Q38 32 30 40 Z" fill="#CED4DA"/><path d="M40 64 L40 74 M35 69 L45 69 M36 66 L44 72 M44 66 L36 72" stroke="#4DABF7" stroke-width="2"/>');
    P.wind = psvg('<path d="M20 44 Q46 44 56 38 Q66 32 78 40 M20 60 Q48 60 60 54 Q72 48 82 56" stroke="#4DABF7" stroke-width="3" fill="none" stroke-linecap="round"/>');
    P.cloud = psvg('<path d="M30 60 Q20 60 22 50 Q22 42 34 44 Q38 32 52 36 Q66 32 68 46 Q80 46 78 58 Q78 64 70 62 Z" fill="#CED4DA"/>');
    P.rainbow = psvg('<path d="M22 70 A28 28 0 0 1 78 70" stroke="#FF6B6B" stroke-width="5" fill="none"/><path d="M30 70 A20 20 0 0 1 70 70" stroke="#FFD43B" stroke-width="5" fill="none"/><path d="M38 70 A12 12 0 0 1 62 70" stroke="#51CF66" stroke-width="5" fill="none"/>');
    P.sunny = psvg('<circle cx="50" cy="50" r="18" fill="#FFD43B"/><path d="M50 16 V26 M16 50 H26 M84 50 H74 M28 28 L35 35 M72 28 L65 35 M28 72 L35 65 M72 72 L65 65" stroke="#FFD43B" stroke-width="3" stroke-linecap="round"/><path d="M42 54 Q50 60 58 54" stroke="#C9824A" stroke-width="2" fill="none"/>');
    P.storm = psvg('<path d="M30 40 Q24 50 34 54 Q44 58 54 54 Q66 50 62 40 Q60 32 50 32 Q38 32 30 40 Z" fill="#868E96"/><path d="M52 54 L44 68 L52 68 L46 82" stroke="#FFD43B" stroke-width="4" fill="none" stroke-linejoin="round"/>');
    // 交通工具
    P.car = psvg('<path d="M22 56 L30 44 L66 44 L74 56 Z" fill="#4DABF7"/><rect x="32" y="40" width="30" height="12" rx="3" fill="#A5D8FF"/><circle cx="34" cy="62" r="7" fill="#343A40"/><circle cx="66" cy="62" r="7" fill="#343A40"/>');
    P.bus = psvg('<rect x="22" y="38" width="56" height="30" rx="8" fill="#FF922B"/><rect x="28" y="44" width="10" height="10" rx="2" fill="#FFF3BF"/><rect x="44" y="44" width="10" height="10" rx="2" fill="#FFF3BF"/><rect x="60" y="44" width="10" height="10" rx="2" fill="#FFF3BF"/><circle cx="34" cy="70" r="6" fill="#343A40"/><circle cx="66" cy="70" r="6" fill="#343A40"/>');
    P.bike = psvg('<circle cx="32" cy="58" r="14" fill="none" stroke="#343A40" stroke-width="3"/><circle cx="68" cy="58" r="14" fill="none" stroke="#343A40" stroke-width="3"/><path d="M32 58 L48 58 L60 40 L68 58 M48 58 L44 40 L52 40" stroke="#E8590C" stroke-width="3" fill="none" stroke-linejoin="round"/>');
    P.train = psvg('<rect x="24" y="40" width="36" height="28" rx="4" fill="#4DABF7"/><rect x="60" y="34" width="20" height="34" rx="4" fill="#FF6B6B"/><rect x="30" y="46" width="10" height="10" rx="2" fill="#FFF3BF"/><rect x="44" y="46" width="10" height="10" rx="2" fill="#FFF3BF"/><circle cx="32" cy="70" r="5" fill="#343A40"/><circle cx="48" cy="70" r="5" fill="#343A40"/><circle cx="68" cy="70" r="5" fill="#343A40"/>');
    P.boat = psvg('<path d="M24 56 L76 56 L66 72 L34 72 Z" fill="#E8590C"/><rect x="46" y="28" width="4" height="28" fill="#868E96"/><path d="M50 30 L66 52 L50 52 Z" fill="#FF6B6B"/>');
    P.plane = psvg('<path d="M20 54 L72 50 Q80 50 80 54 Q80 58 72 58 L20 62 Z" fill="#4DABF7"/><path d="M44 54 L36 34 L48 52 Z" fill="#A5D8FF"/><path d="M44 56 L36 78 L48 58 Z" fill="#A5D8FF"/><path d="M64 52 L74 44 L70 54 Z" fill="#A5D8FF"/>');
    P.taxi = psvg('<path d="M22 56 L30 44 L66 44 L74 56 Z" fill="#FFD43B"/><rect x="32" y="40" width="30" height="12" rx="3" fill="#FFF3BF"/><rect x="44" y="28" width="12" height="8" rx="2" fill="#343A40"/><circle cx="34" cy="62" r="7" fill="#343A40"/><circle cx="66" cy="62" r="7" fill="#343A40"/>');
    P.ship = psvg('<path d="M20 52 L80 52 L72 74 L28 74 Z" fill="#868E96"/><rect x="44" y="34" width="12" height="18" fill="#FF6B6B"/><rect x="40" y="28" width="20" height="8" fill="#FF922B"/>');
    // 动作
    P.eat = psvg('<circle cx="50" cy="26" r="9" fill="#FFD8A8"/><rect x="42" y="36" width="16" height="22" rx="6" fill="#4DABF7"/><path d="M40 60 L46 60 M54 60 L60 60" stroke="#343A40" stroke-width="3"/><path d="M62 28 L74 24 L73 33 Z" fill="#FFD8A8"/><path d="M60 38 Q72 44 62 50" stroke="#868E96" stroke-width="2" fill="none"/>');
    P.drink = psvg('<circle cx="50" cy="26" r="9" fill="#FFD8A8"/><rect x="42" y="36" width="16" height="22" rx="6" fill="#4DABF7"/><path d="M40 60 L46 60 M54 60 L60 60" stroke="#343A40" stroke-width="3"/><rect x="62" y="34" width="12" height="14" rx="2" fill="#4DABF7"/><rect x="62" y="34" width="12" height="5" rx="2" fill="#FFD43B"/>');
    P.sleep = psvg('<circle cx="32" cy="56" r="9" fill="#FFD8A8"/><rect x="40" y="48" width="30" height="16" rx="6" fill="#4DABF7"/><path d="M70 30 L78 30 L70 38 Z" fill="#868E96"/><path d="M76 22 L83 22 L76 29 Z" fill="#ADB5BD"/>');
    P.run = psvg('<circle cx="50" cy="26" r="9" fill="#FFD8A8"/><rect x="42" y="36" width="16" height="22" rx="6" fill="#4DABF7"/><path d="M40 60 L34 70 M54 60 L62 68" stroke="#343A40" stroke-width="3"/><path d="M42 40 L30 36 M58 40 L70 44" stroke="#343A40" stroke-width="3"/>');
    P.jump = psvg('<circle cx="50" cy="22" r="9" fill="#FFD8A8"/><rect x="42" y="32" width="16" height="22" rx="6" fill="#4DABF7"/><path d="M42 38 L34 30 M58 38 L66 30" stroke="#343A40" stroke-width="3"/><path d="M40 56 L34 48 M54 56 L60 48" stroke="#343A40" stroke-width="3"/><path d="M28 82 Q50 74 72 82" stroke="#CED4DA" stroke-width="2" fill="none"/>');
    P.sing = psvg('<circle cx="50" cy="26" r="9" fill="#FFD8A8"/><rect x="42" y="36" width="16" height="22" rx="6" fill="#4DABF7"/><path d="M40 60 L46 60 M54 60 L60 60" stroke="#343A40" stroke-width="3"/><circle cx="70" cy="30" r="4" fill="#FF6B6B"/><rect x="73" y="20" width="2" height="10" fill="#FF6B6B"/><path d="M68 18 L74 18 L68 24 Z" fill="#FF6B6B"/>');
    P.read = psvg('<circle cx="50" cy="26" r="9" fill="#FFD8A8"/><rect x="42" y="36" width="16" height="22" rx="6" fill="#4DABF7"/><path d="M40 60 L46 60 M54 60 L60 60" stroke="#343A40" stroke-width="3"/><rect x="60" y="42" width="18" height="14" rx="2" fill="#FFD43B"/><path d="M69 42 L69 56" stroke="#868E96" stroke-width="1.5"/>');
    P.draw = psvg('<circle cx="50" cy="26" r="9" fill="#FFD8A8"/><rect x="42" y="36" width="16" height="22" rx="6" fill="#4DABF7"/><path d="M40 60 L46 60 M54 60 L60 60" stroke="#343A40" stroke-width="3"/><rect x="60" y="42" width="16" height="18" rx="2" fill="#FFFFFF" stroke="#CED4DA" stroke-width="1.5"/><path d="M63 54 L72 44" stroke="#343A40" stroke-width="2"/>');
    P.walk = psvg('<circle cx="50" cy="26" r="9" fill="#FFD8A8"/><rect x="42" y="36" width="16" height="22" rx="6" fill="#4DABF7"/><path d="M40 60 L36 70 M54 60 L58 70" stroke="#343A40" stroke-width="3"/><path d="M42 40 L52 36 M58 40 L48 36" stroke="#343A40" stroke-width="3"/>');
    P.dance = psvg('<circle cx="50" cy="26" r="9" fill="#FFD8A8"/><rect x="42" y="36" width="16" height="22" rx="6" fill="#FF6B6B"/><path d="M42 40 L30 30 M58 40 L70 30" stroke="#343A40" stroke-width="3"/><path d="M40 60 L44 70 M54 60 L50 70" stroke="#343A40" stroke-width="3"/>');
    /* ↓ v4.182 新增：职业（10 张）。画法＝同一个小人换「衣服颜色 + 随身物件」，
       孩子一眼能认出来是干什么的，不靠文字。 */
    function person(coat, hat, extra) {
      var s = '<circle cx="50" cy="34" r="14" fill="#FFD8A8"/>' +
        '<path d="M36 32 Q38 18 50 18 Q62 18 64 32 Q56 26 50 27 Q44 26 36 32 Z" fill="#3B2A1A"/>' +
        '<circle cx="45" cy="35" r="2.2" fill="#343A40"/><circle cx="55" cy="35" r="2.2" fill="#343A40"/>' +
        '<path d="M45 41 Q50 45 55 41" stroke="#C9824A" stroke-width="1.8" fill="none"/>' +
        '<path d="M36 54 Q36 48 50 48 Q64 48 64 54 L66 84 L34 84 Z" fill="' + coat + '"/>';
      if (hat) s += hat;
      if (extra) s += extra;
      return psvg(s);
    }
    P.teacher = person('#4DABF7', null,
      '<circle cx="44" cy="35" r="5" fill="none" stroke="#868E96" stroke-width="1.6"/><circle cx="56" cy="35" r="5" fill="none" stroke="#868E96" stroke-width="1.6"/><path d="M49 35 L51 35" stroke="#868E96" stroke-width="1.6"/>' +
      '<rect x="36" y="62" width="26" height="17" rx="2" fill="#FFFFFF" stroke="#CED4DA" stroke-width="1.5"/><path d="M49 62 L49 79" stroke="#868E96" stroke-width="1.5"/><path d="M40 68 L47 68 M51 68 L58 68" stroke="#ADB5BD" stroke-width="1.5"/>');
    P.doctor = person('#F1F3F5', null,
      '<path d="M42 54 Q42 68 50 68 Q58 68 58 58" stroke="#495057" stroke-width="2.5" fill="none"/><circle cx="58" cy="57" r="3" fill="#495057"/>' +
      '<rect x="57" y="58" width="11" height="4" fill="#FF6B6B"/><rect x="60.5" y="54.5" width="4" height="11" fill="#FF6B6B"/>');
    P.nurse = person('#FFC9C9',
      '<path d="M37 28 Q37 15 50 15 Q63 15 63 28 Z" fill="#FFFFFF" stroke="#E9ECEF" stroke-width="1.5"/>' +
      '<path d="M47 20 h3 v-3 h3 v3 h3 v3 h-3 v3 h-3 v-3 h-3 Z" fill="#FF6B6B"/>',
      '<rect x="57" y="58" width="11" height="4" fill="#FFFFFF"/><rect x="60.5" y="54.5" width="4" height="11" fill="#FFFFFF"/>');
    P.cook = person('#F1F3F5',
      '<path d="M35 30 Q32 13 41 13 Q41 6 50 6 Q59 6 59 13 Q68 13 65 30 Z" fill="#FFFFFF" stroke="#E9ECEF" stroke-width="1.5"/>',
      '<circle cx="72" cy="70" r="10" fill="#495057"/><path d="M81 68 L94 66" stroke="#495057" stroke-width="3"/><circle cx="70" cy="66" r="4" fill="#FFD8A8"/>');
    P.driver = person('#FF922B',
      '<path d="M36 28 Q36 17 50 17 Q64 17 64 28 Z" fill="#343A40"/><rect x="33" y="28" width="34" height="5" rx="2.5" fill="#495057"/>',
      '<circle cx="50" cy="70" r="12" fill="none" stroke="#343A40" stroke-width="3"/><path d="M50 58 L50 70 M38 70 L62 70" stroke="#343A40" stroke-width="3"/>');
    P.farmer = person('#69DB7C',
      '<ellipse cx="50" cy="27" rx="27" ry="7" fill="#FCC419"/><path d="M38 27 Q38 16 50 16 Q62 16 62 27 Z" fill="#FFD43B"/>',
      '<path d="M78 84 L78 56 L64 51" stroke="#8B5A2B" stroke-width="3" fill="none"/><path d="M59 46 L68 49 L62 57 Z" fill="#868E96"/>');
    P.police = person('#1C7ED6',
      '<path d="M36 28 Q36 16 50 16 Q64 16 64 28 Z" fill="#1864AB"/><rect x="33" y="28" width="34" height="5" rx="2.5" fill="#1C7ED6"/><circle cx="50" cy="21" r="3" fill="#FFD43B"/>',
      '<path d="M50 60 L53 66 L59 66 L54 70 L56 76 L50 73 L44 76 L46 70 L41 66 L47 66 Z" fill="#FFD43B"/>');
    P.worker = person('#FF922B',
      '<path d="M34 30 Q34 16 50 16 Q66 16 66 30 Z" fill="#FFD43B"/><rect x="31" y="29" width="38" height="5" rx="2.5" fill="#F59F00"/>',
      '<path d="M40 60 L60 60 M40 66 L60 66" stroke="#FFFFFF" stroke-width="3"/><path d="M72 80 L84 68" stroke="#868E96" stroke-width="3"/><path d="M82 64 Q86 60 90 64 L86 68 Z" fill="#868E96"/>');
    P.singer = person('#FF6B6B', null,
      '<rect x="70" y="58" width="3" height="20" fill="#495057"/><circle cx="71.5" cy="54" r="6" fill="#495057"/><circle cx="70" cy="66" r="4" fill="#FFD8A8"/>' +
      '<path d="M28 58 L28 72" stroke="#343A40" stroke-width="2"/><circle cx="25" cy="74" r="4" fill="#343A40"/><path d="M28 58 Q36 60 36 66" stroke="#343A40" stroke-width="2" fill="none"/>');
    P.student = person('#FFD43B', null,
      '<rect x="56" y="56" width="19" height="22" rx="4" fill="#FF6B6B"/><rect x="61" y="62" width="9" height="7" rx="1.5" fill="#C92A2A"/>' +
      '<rect x="27" y="66" width="17" height="13" rx="2" fill="#4DABF7"/><path d="M35.5 66 L35.5 79" stroke="#FFFFFF" stroke-width="1.5"/><circle cx="30" cy="72" r="3.5" fill="#FFD8A8"/>');
    /* ↓ v4.226 新增配图：学校 / 时间 / 方位 / 形状 / 样子 / 房间 / 户外 / 动物2，共 46 张 */
    P.school = psvg('<rect x="20" y="40" width="60" height="40" fill="#FFD8A8"/><path d="M14 40 L50 18 L86 40 Z" fill="#FF6B6B"/><rect x="44" y="60" width="14" height="20" fill="#4DABF7"/><rect x="26" y="52" width="12" height="10" fill="#FFD43B"/><rect x="64" y="52" width="12" height="10" fill="#FFD43B"/>');
    P.classroom = psvg('<rect x="16" y="24" width="68" height="36" rx="3" fill="#2F4F3A"/><rect x="22" y="30" width="56" height="22" fill="#FFFFFF" opacity="0.15"/><rect x="24" y="66" width="52" height="6" fill="#C9824A"/><rect x="28" y="72" width="6" height="12" fill="#C9824A"/><rect x="66" y="72" width="6" height="12" fill="#C9824A"/>');
    P.desk = psvg('<rect x="16" y="44" width="68" height="8" rx="2" fill="#C9824A"/><rect x="20" y="52" width="6" height="30" fill="#A9672F"/><rect x="74" y="52" width="6" height="30" fill="#A9672F"/><rect x="30" y="24" width="26" height="18" rx="2" fill="#4DABF7"/>');
    P.chair = psvg('<rect x="34" y="18" width="32" height="28" rx="4" fill="#4DABF7"/><rect x="30" y="46" width="40" height="8" rx="2" fill="#4DABF7"/><rect x="32" y="54" width="6" height="28" fill="#339AF0"/><rect x="62" y="54" width="6" height="28" fill="#339AF0"/>');
    P.blackboard = psvg('<rect x="14" y="18" width="72" height="54" rx="4" fill="#2F4F3A"/><rect x="20" y="24" width="60" height="42" fill="#FFFFFF" opacity="0.12"/><path d="M28 42 L46 42 M28 54 L58 54" stroke="#FFFFFF" stroke-width="3" opacity="0.75"/><rect x="14" y="72" width="72" height="5" fill="#C9824A"/>');
    P.flag = psvg('<rect x="22" y="16" width="4" height="70" fill="#868E96"/><path d="M26 20 L74 20 L74 46 L26 46 Z" fill="#EE1010"/><circle cx="40" cy="30" r="4" fill="#FFDE00"/><circle cx="53" cy="26" r="2.5" fill="#FFDE00"/><circle cx="57" cy="34" r="2.5" fill="#FFDE00"/><circle cx="49" cy="37" r="2.5" fill="#FFDE00"/>');
    P.morning = psvg('<circle cx="50" cy="34" r="16" fill="#FFD43B"/><path d="M50 12 L50 6 M32 34 L26 34 M68 34 L74 34 M38 20 L34 15 M62 20 L66 15" stroke="#FFD43B" stroke-width="3"/><path d="M8 80 Q30 56 50 80 Q70 56 92 80 Z" fill="#51CF66"/>');
    P.afternoon = psvg('<circle cx="66" cy="30" r="14" fill="#FF922B"/><path d="M66 10 L66 5 M51 30 L46 30 M81 30 L86 30" stroke="#FF922B" stroke-width="3"/><path d="M8 80 Q30 58 50 80 Q70 58 92 80 Z" fill="#94D82D"/>');
    P.evening = psvg('<circle cx="50" cy="44" r="18" fill="#FF6B6B"/><path d="M18 62 Q30 50 42 62 Q54 52 66 62 Q78 54 86 62" stroke="#FFA8A8" stroke-width="4" fill="none"/><path d="M8 84 L92 84" stroke="#868E96" stroke-width="3"/>');
    P.night = psvg('<path d="M64 18 A22 22 0 1 0 64 62 A18 18 0 1 1 64 18 Z" fill="#FFD43B"/><circle cx="28" cy="26" r="2.5" fill="#FFD43B"/><circle cx="40" cy="42" r="2" fill="#FFD43B"/><circle cx="24" cy="56" r="2" fill="#FFD43B"/><rect x="10" y="82" width="80" height="4" rx="2" fill="#495057"/>');
    P.today = psvg('<rect x="16" y="22" width="68" height="60" rx="6" fill="#FFFFFF" stroke="#4DABF7" stroke-width="3"/><rect x="16" y="22" width="68" height="14" fill="#4DABF7"/><path d="M32 52 L44 64 L68 42" stroke="#51CF66" stroke-width="6" fill="none"/>');
    P.tomorrow = psvg('<rect x="14" y="22" width="58" height="58" rx="6" fill="#FFFFFF" stroke="#868E96" stroke-width="3"/><rect x="14" y="22" width="58" height="14" fill="#ADB5BD"/><path d="M64 60 L84 60 M76 52 L86 60 L76 68" stroke="#FF6B6B" stroke-width="4" fill="none"/>');
    P.in = psvg('<rect x="18" y="38" width="64" height="44" rx="6" fill="#FFE8CC" stroke="#C9824A" stroke-width="3"/><circle cx="50" cy="60" r="13" fill="#FF6B6B"/>');
    P.on = psvg('<circle cx="50" cy="40" r="13" fill="#4DABF7"/><rect x="18" y="54" width="64" height="28" rx="6" fill="#FFE8CC" stroke="#C9824A" stroke-width="3"/>');
    P.under = psvg('<rect x="18" y="24" width="64" height="28" rx="6" fill="#FFE8CC" stroke="#C9824A" stroke-width="3"/><circle cx="50" cy="68" r="13" fill="#51CF66"/>');
    P.behind = psvg('<circle cx="64" cy="50" r="13" fill="#FF6B6B"/><rect x="14" y="36" width="44" height="44" rx="6" fill="#FFE8CC" stroke="#C9824A" stroke-width="3"/>');
    P.up = psvg('<path d="M50 16 L76 46 L63 46 L63 84 L37 84 L37 46 L24 46 Z" fill="#4DABF7"/>');
    P.down = psvg('<path d="M50 84 L24 54 L37 54 L37 16 L63 16 L63 54 L76 54 Z" fill="#FF922B"/>');
    P.circle = psvg('<circle cx="50" cy="50" r="32" fill="#4DABF7"/>');
    P.square = psvg('<rect x="18" y="18" width="64" height="64" rx="4" fill="#FF6B6B"/>');
    P.triangle = psvg('<path d="M50 16 L86 80 L14 80 Z" fill="#51CF66"/>');
    P.star = psvg('<path d="M50 14 L61 42 L91 44 L67 62 L75 91 L50 74 L25 91 L33 62 L9 44 L39 42 Z" fill="#FFD43B"/>');
    P.heart = psvg('<path d="M50 84 C18 60 14 38 30 28 C40 21 50 31 50 40 C50 31 60 21 70 28 C86 38 82 60 50 84 Z" fill="#FF6B6B"/>');
    P.tall = psvg('<rect x="26" y="12" width="18" height="74" rx="3" fill="#4DABF7"/><rect x="58" y="52" width="18" height="34" rx="3" fill="#CED4DA"/><path d="M18 88 L82 88" stroke="#343A40" stroke-width="3"/>');
    P.short = psvg('<rect x="26" y="52" width="18" height="34" rx="3" fill="#4DABF7"/><rect x="58" y="12" width="18" height="74" rx="3" fill="#CED4DA"/><path d="M18 88 L82 88" stroke="#343A40" stroke-width="3"/>');
    P.long = psvg('<path d="M12 50 Q30 32 48 50 Q66 68 84 50" stroke="#FF922B" stroke-width="6" fill="none"/><circle cx="12" cy="50" r="6" fill="#FF922B"/><circle cx="84" cy="50" r="6" fill="#FF922B"/>');
    P.fast = psvg('<path d="M16 28 L48 28 M16 50 L60 50 M16 72 L40 72" stroke="#4DABF7" stroke-width="5"/><path d="M54 28 L72 28 M54 50 L80 50" stroke="#FF6B6B" stroke-width="5"/><path d="M68 20 L86 28 L68 36 Z" fill="#FF6B6B"/>');
    P.slow = psvg('<ellipse cx="48" cy="58" rx="26" ry="18" fill="#51CF66"/><circle cx="72" cy="52" r="11" fill="#51CF66"/><path d="M26 78 L26 84 M48 78 L48 84 M66 78 L66 84" stroke="#2F9E44" stroke-width="4"/><circle cx="68" cy="49" r="2" fill="#343A40"/>');
    P.good = psvg('<path d="M38 46 L38 26 Q38 19 45 19 Q51 19 51 26 L51 42 L57 40 Q67 36 71 44 L75 56 Q77 62 71 64 L45 64 Q38 64 38 58 Z" fill="#FFD8A8"/><path d="M38 58 L38 78 Q38 85 46 85 L62 85 Q70 85 70 78 L70 64" fill="#FFD43B"/>');
    P.bed = psvg('<rect x="12" y="52" width="76" height="26" rx="4" fill="#4DABF7"/><rect x="14" y="42" width="28" height="14" rx="4" fill="#FFFFFF" stroke="#CED4DA" stroke-width="2"/><rect x="12" y="78" width="6" height="10" fill="#C9824A"/><rect x="82" y="78" width="6" height="10" fill="#C9824A"/>');
    P.table = psvg('<rect x="10" y="38" width="80" height="10" rx="3" fill="#C9824A"/><rect x="16" y="48" width="8" height="34" fill="#A9672F"/><rect x="76" y="48" width="8" height="34" fill="#A9672F"/>');
    P.door = psvg('<rect x="26" y="12" width="48" height="76" rx="3" fill="#C9824A"/><rect x="32" y="20" width="36" height="26" rx="2" fill="#A9672F"/><rect x="32" y="54" width="36" height="26" rx="2" fill="#A9672F"/><circle cx="64" cy="54" r="4" fill="#FFD43B"/>');
    P.window = psvg('<rect x="16" y="16" width="68" height="68" rx="4" fill="#B3E5FC" stroke="#868E96" stroke-width="4"/><path d="M50 16 L50 84 M16 50 L84 50" stroke="#868E96" stroke-width="4"/><circle cx="34" cy="34" r="6" fill="#FFD43B"/>');
    P.lamp = psvg('<path d="M30 42 L70 42 L62 20 L38 20 Z" fill="#FFD43B"/><rect x="48" y="42" width="4" height="34" fill="#868E96"/><ellipse cx="50" cy="78" rx="18" ry="6" fill="#868E96"/>');
    P.sofa = psvg('<rect x="12" y="44" width="76" height="30" rx="8" fill="#FF6B6B"/><rect x="20" y="28" width="60" height="22" rx="8" fill="#FF8787"/><rect x="8" y="50" width="12" height="26" rx="6" fill="#FF6B6B"/><rect x="80" y="50" width="12" height="26" rx="6" fill="#FF6B6B"/>');
    P.tree = psvg('<rect x="44" y="52" width="12" height="36" fill="#A9672F"/><circle cx="50" cy="38" r="24" fill="#51CF66"/><circle cx="32" cy="52" r="14" fill="#51CF66"/><circle cx="68" cy="52" r="14" fill="#51CF66"/>');
    P.flower = psvg('<circle cx="50" cy="32" r="10" fill="#FF6B6B"/><circle cx="36" cy="44" r="9" fill="#FF6B6B"/><circle cx="64" cy="44" r="9" fill="#FF6B6B"/><circle cx="50" cy="50" r="9" fill="#FF6B6B"/><circle cx="50" cy="41" r="7" fill="#FFD43B"/><path d="M50 58 L50 86" stroke="#2F9E44" stroke-width="4"/><path d="M50 70 Q62 66 62 78 Q62 84 50 84" fill="#2F9E44"/>');
    P.grass = psvg('<path d="M18 84 Q22 56 18 38 M34 84 Q38 50 34 32 M50 84 Q54 58 50 40 M66 84 Q70 52 66 36 M82 84 Q86 60 82 44" stroke="#51CF66" stroke-width="6" fill="none"/><rect x="8" y="82" width="84" height="6" fill="#A9672F"/>');
    P.river = psvg('<path d="M8 36 Q28 22 48 36 Q68 50 92 36 L92 56 Q68 70 48 56 Q28 42 8 56 Z" fill="#4DABF7"/><path d="M8 64 Q28 50 48 64 Q68 78 92 64 L92 86 L8 86 Z" fill="#339AF0"/>');
    P.hill = psvg('<path d="M6 82 Q28 38 50 82 Z" fill="#51CF66"/><path d="M44 82 Q70 32 94 82 Z" fill="#2F9E44"/><circle cx="32" cy="28" r="8" fill="#FFD43B"/>');
    P.sky = psvg('<rect x="0" y="0" width="100" height="100" rx="18" fill="#B3E5FC"/><circle cx="72" cy="26" r="12" fill="#FFD43B"/><ellipse cx="32" cy="42" rx="18" ry="10" fill="#FFFFFF"/><ellipse cx="52" cy="50" rx="14" ry="8" fill="#FFFFFF"/>');
    P.cow = psvg('<ellipse cx="50" cy="56" rx="28" ry="20" fill="#FFFFFF"/><ellipse cx="36" cy="40" rx="10" ry="8" fill="#343A40"/><ellipse cx="66" cy="46" rx="9" ry="7" fill="#343A40"/><circle cx="26" cy="34" r="10" fill="#FFFFFF"/><circle cx="22" cy="30" r="3" fill="#FF6B6B"/><circle cx="30" cy="38" r="3" fill="#FF6B6B"/><path d="M38 76 L38 88 M60 76 L60 88" stroke="#343A40" stroke-width="5"/>');
    P.horse = psvg('<ellipse cx="50" cy="58" rx="26" ry="18" fill="#C9824A"/><path d="M62 42 Q76 26 70 20 Q62 24 62 36 Z" fill="#8B5E34"/><circle cx="28" cy="40" r="13" fill="#C9824A"/><path d="M22 28 L20 16 L29 25 Z" fill="#8B5E34"/><path d="M34 76 L34 90 M64 76 L64 90" stroke="#8B5E34" stroke-width="5"/><circle cx="24" cy="38" r="2" fill="#343A40"/>');
    P.sheep = psvg('<circle cx="34" cy="52" r="14" fill="#FFFFFF"/><circle cx="52" cy="46" r="14" fill="#FFFFFF"/><circle cx="66" cy="56" r="13" fill="#FFFFFF"/><circle cx="48" cy="68" r="12" fill="#FFFFFF"/><circle cx="32" cy="66" r="11" fill="#FFFFFF"/><circle cx="26" cy="40" r="9" fill="#343A40"/><path d="M28 78 L28 90 M56 78 L56 90" stroke="#343A40" stroke-width="4"/>');
    P.elephant = psvg('<ellipse cx="44" cy="56" rx="28" ry="22" fill="#ADB5BD"/><circle cx="72" cy="46" r="18" fill="#ADB5BD"/><path d="M58 52 Q38 74 44 84 Q52 88 58 82" fill="#ADB5BD"/><path d="M80 28 L88 34 L83 44 Z" fill="#FFFFFF"/><circle cx="78" cy="42" r="3" fill="#343A40"/><path d="M28 78 L28 90 M60 78 L60 90" stroke="#868E96" stroke-width="6"/>');
    P.panda = psvg('<circle cx="50" cy="50" r="28" fill="#FFFFFF"/><circle cx="32" cy="32" r="10" fill="#343A40"/><circle cx="68" cy="32" r="10" fill="#343A40"/><circle cx="42" cy="46" r="5" fill="#343A40"/><circle cx="58" cy="46" r="5" fill="#343A40"/><circle cx="50" cy="58" r="4" fill="#343A40"/>');
    return P;
  })(),

  /* ================================================================
     v4.226 新增三块新料（家长：原来的 156 个词全是名词，功能词一个没有；
     78 句口语全是单句，没有一来一往的对话；也完全没有能读的小短文）
     ================================================================ */
  /* 高频词 40：[词, 中文, 小短语, 短语中文] —— 不背、不默写，点一下听短语混耳熟 */
  sw: [
    ['I', '我', 'I am Tom.', '我是汤姆。'],
    ['you', '你', 'You are nice.', '你真好。'],
    ['he', '他', 'He is my dad.', '他是我爸爸。'],
    ['she', '她', 'She is my mum.', '她是我妈妈。'],
    ['it', '它', 'It is a cat.', '它是一只猫。'],
    ['we', '我们', 'We are friends.', '我们是朋友。'],
    ['they', '他们', 'They are happy.', '他们很开心。'],
    ['am', '是', 'I am six.', '我六岁。'],
    ['is', '是', 'It is red.', '它是红色的。'],
    ['are', '是', 'We are here.', '我们在这儿。'],
    ['the', '这个', 'the sun', '太阳'],
    ['a', '一个', 'a book', '一本书'],
    ['to', '去', 'Go to school.', '去上学。'],
    ['and', '和', 'Mum and Dad', '妈妈和爸爸'],
    ['have', '有', 'I have a ball.', '我有一个球。'],
    ['has', '有', 'She has a doll.', '她有一个娃娃。'],
    ['can', '能', 'I can run.', '我会跑。'],
    ['like', '喜欢', 'I like apples.', '我喜欢苹果。'],
    ['want', '想要', 'I want water.', '我想要水。'],
    ['go', '去', 'Let\'s go.', '我们走吧。'],
    ['see', '看见', 'I see a bird.', '我看见一只鸟。'],
    ['look', '看', 'Look at me!', '看着我！'],
    ['come', '来', 'Come here.', '过来。'],
    ['my', '我的', 'my bag', '我的书包'],
    ['your', '你的', 'your book', '你的书'],
    ['this', '这', 'This is my desk.', '这是我的课桌。'],
    ['that', '那', 'That is a dog.', '那是一只狗。'],
    ['here', '这里', 'Come here.', '到这儿来。'],
    ['there', '那里', 'Go there.', '去那边。'],
    ['yes', '是', 'Yes, please.', '好的，麻烦了。'],
    ['no', '不', 'No, thank you.', '不用了，谢谢。'],
    ['not', '不', 'I am not sad.', '我不伤心。'],
    ['little', '小', 'a little cat', '一只小猫'],
    ['with', '和…一起', 'with my mum', '和我妈妈一起'],
    ['me', '我', 'Look at me.', '看看我。'],
    ['for', '给', 'This is for you.', '这是给你的。'],
    ['do', '做', 'I do it.', '我来做。'],
    ['who', '谁', 'Who is he?', '他是谁？'],
    ['what', '什么', 'What is it?', '这是什么？'],
    ['where', '哪里', 'Where is it?', '它在哪儿？']
  ],
  /* 迷你对话 30 组：s=场景，l=[角色, 英文, 中文]，可分角色一句句念 */
  dlg: [
    { s: '早上见面', l: [
      ['A', 'Good morning!', '早上好！'],
      ['B', 'Good morning!', '早上好！'],
      ['A', 'How are you?', '你好吗？'],
      ['B', 'I\'m fine, thank you.', '我很好，谢谢。']
    ] },
    { s: '问名字', l: [
      ['A', 'What\'s your name?', '你叫什么名字？'],
      ['B', 'My name is Lili.', '我叫丽丽。'],
      ['A', 'Nice to meet you!', '很高兴认识你！'],
      ['B', 'Nice to meet you, too!', '我也很高兴！']
    ] },
    { s: '借橡皮', l: [
      ['A', 'Can I use your eraser?', '我能用一下你的橡皮吗？'],
      ['B', 'Sure, here you are.', '当然，给你。'],
      ['A', 'Thank you!', '谢谢！'],
      ['B', 'You\'re welcome.', '不客气。']
    ] },
    { s: '借铅笔', l: [
      ['A', 'I have no pencil.', '我没有铅笔。'],
      ['B', 'Here, take mine.', '给，用我的。'],
      ['A', 'Thanks!', '谢谢！'],
      ['B', 'No problem.', '没事儿。']
    ] },
    { s: '一起玩', l: [
      ['A', 'Let\'s play!', '一起玩吧！'],
      ['B', 'OK!', '好呀！'],
      ['A', 'What do you want to play?', '你想玩什么？'],
      ['B', 'Let\'s play ball.', '我们玩球吧。']
    ] },
    { s: '吃饭了', l: [
      ['A', 'I\'m hungry.', '我饿了。'],
      ['B', 'Let\'s eat.', '吃饭吧。'],
      ['A', 'Yummy!', '真好吃！'],
      ['B', 'I like rice too.', '我也喜欢米饭。']
    ] },
    { s: '喝水', l: [
      ['A', 'I\'m thirsty.', '我渴了。'],
      ['B', 'Have some water.', '喝点水。'],
      ['A', 'Thank you.', '谢谢。'],
      ['B', 'You\'re welcome.', '不客气。']
    ] },
    { s: '上厕所', l: [
      ['A', 'May I go to the toilet?', '我可以去洗手间吗？'],
      ['B', 'Yes, go ahead.', '可以，去吧。'],
      ['A', 'Thank you.', '谢谢。'],
      ['B', 'Come back soon.', '快点回来。']
    ] },
    { s: '找老师', l: [
      ['A', 'Where is Miss Li?', '李老师在哪儿？'],
      ['B', 'She is in the classroom.', '她在教室里。'],
      ['A', 'Thank you.', '谢谢。'],
      ['B', 'You\'re welcome.', '不客气。']
    ] },
    { s: '放学了', l: [
      ['A', 'School is over.', '放学了。'],
      ['B', 'Let\'s go home.', '回家吧。'],
      ['A', 'See you tomorrow!', '明天见！'],
      ['B', 'Bye-bye!', '再见！']
    ] },
    { s: '买铅笔', l: [
      ['A', 'How much is it?', '多少钱？'],
      ['B', 'Two yuan.', '两块钱。'],
      ['A', 'Here you are.', '给你。'],
      ['B', 'Thank you.', '谢谢。']
    ] },
    { s: '买冰淇淋', l: [
      ['A', 'I want ice cream.', '我想要冰淇淋。'],
      ['B', 'Here you are.', '给你。'],
      ['A', 'How much?', '多少钱？'],
      ['B', 'Three yuan.', '三块钱。']
    ] },
    { s: '看医生', l: [
      ['A', 'What\'s wrong?', '哪里不舒服？'],
      ['B', 'I have a cold.', '我感冒了。'],
      ['A', 'Drink more water.', '多喝点水。'],
      ['B', 'OK, Doctor.', '好的，医生。']
    ] },
    { s: '过生日', l: [
      ['A', 'Happy birthday!', '生日快乐！'],
      ['B', 'Thank you!', '谢谢！'],
      ['A', 'This is for you.', '这是给你的。'],
      ['B', 'Wow, a gift!', '哇，礼物！']
    ] },
    { s: '下雨天', l: [
      ['A', 'It\'s raining.', '下雨了。'],
      ['B', 'Take your umbrella.', '带上你的伞。'],
      ['A', 'OK, Mum.', '好的妈妈。'],
      ['B', 'Be careful.', '小心点。']
    ] },
    { s: '东西丢了', l: [
      ['A', 'I can\'t find my bag.', '我找不到书包了。'],
      ['B', 'What colour is it?', '什么颜色的？'],
      ['A', 'It\'s blue.', '蓝色的。'],
      ['B', 'Let\'s look together.', '我们一起找。']
    ] },
    { s: '问路', l: [
      ['A', 'Where is the library?', '图书馆在哪儿？'],
      ['B', 'Go straight, then turn left.', '直走，然后左转。'],
      ['A', 'Thank you!', '谢谢！'],
      ['B', 'You\'re welcome.', '不客气。']
    ] },
    { s: '打电话', l: [
      ['A', 'Hello, this is Lili.', '喂，我是丽丽。'],
      ['B', 'Hi Lili, this is Tom.', '嗨丽丽，我是汤姆。'],
      ['A', 'Can you play?', '你能出来玩吗？'],
      ['B', 'Yes, see you!', '能，一会儿见！']
    ] },
    { s: '介绍朋友', l: [
      ['A', 'This is my friend Tom.', '这是我的朋友汤姆。'],
      ['B', 'Hello, Tom!', '你好，汤姆！'],
      ['B', 'Nice to meet you.', '很高兴认识你。'],
      ['A', 'Nice to meet you too.', '我也很高兴。']
    ] },
    { s: '说对不起', l: [
      ['A', 'I\'m sorry.', '对不起。'],
      ['B', 'That\'s OK.', '没关系。'],
      ['A', 'I didn\'t mean it.', '我不是故意的。'],
      ['B', 'Never mind.', '别放在心上。']
    ] },
    { s: '说谢谢', l: [
      ['A', 'Thank you very much.', '非常感谢。'],
      ['B', 'You\'re welcome.', '不客气。'],
      ['A', 'You are so kind.', '你真好。'],
      ['B', 'Thank you!', '谢谢你！']
    ] },
    { s: '请帮忙', l: [
      ['A', 'Can you help me?', '你能帮我吗？'],
      ['B', 'Sure!', '当然！'],
      ['A', 'This bag is heavy.', '这个包很重。'],
      ['B', 'Let me help you.', '我来帮你。']
    ] },
    { s: '没听懂', l: [
      ['A', 'I don\'t understand.', '我没听懂。'],
      ['B', 'Let me say it again.', '我再说一遍。'],
      ['A', 'Thank you, teacher.', '谢谢老师。'],
      ['B', 'You\'re welcome.', '不客气。']
    ] },
    { s: '回到家', l: [
      ['A', 'I\'m home!', '我回来啦！'],
      ['B', 'Welcome back.', '欢迎回来。'],
      ['B', 'How was school?', '学校怎么样？'],
      ['A', 'It was fun!', '很有意思！']
    ] },
    { s: '睡觉前', l: [
      ['A', 'Time for bed.', '该睡觉了。'],
      ['B', 'Good night, Mum.', '晚安，妈妈。'],
      ['A', 'Sweet dreams.', '做个好梦。'],
      ['B', 'Good night.', '晚安。']
    ] },
    { s: '起床', l: [
      ['A', 'Wake up!', '起床啦！'],
      ['B', 'I\'m sleepy.', '我好困。'],
      ['A', 'It\'s time for school.', '该上学了。'],
      ['B', 'OK, I\'m up.', '好吧，我起来了。']
    ] },
    { s: '看电视', l: [
      ['A', 'Can I watch TV?', '我能看电视吗？'],
      ['B', 'For ten minutes.', '看十分钟。'],
      ['A', 'Thank you, Mum!', '谢谢妈妈！'],
      ['B', 'OK.', '好的。']
    ] },
    { s: '去公园', l: [
      ['A', 'Let\'s go to the park.', '我们去公园吧。'],
      ['B', 'Hooray!', '太好啦！'],
      ['A', 'Look at the flowers!', '快看那些花！'],
      ['B', 'They are beautiful.', '真漂亮。']
    ] },
    { s: '我的宠物', l: [
      ['A', 'I have a cat.', '我有一只猫。'],
      ['B', 'What\'s its name?', '它叫什么名字？'],
      ['A', 'Its name is Mimi.', '它叫咪咪。'],
      ['B', 'So cute!', '太可爱了！']
    ] },
    { s: '画画', l: [
      ['A', 'I am drawing.', '我在画画。'],
      ['B', 'What is it?', '画的是什么？'],
      ['A', 'It\'s my family.', '是我的家人。'],
      ['B', 'How nice!', '真好看！']
    ] }
  ],
  /* 分级小故事 25 篇：t=标题，p=配图键，l=[英文, 中文]，q=读后一题（q 题干 / o 选项 / a 正确项序号） */
  rd: [
    { t: 'My Cat', p: 'cat', l: [
      ['I have a cat.', '我有一只猫。'],
      ['It is white.', '它是白色的。'],
      ['It is little.', '它小小的。'],
      ['I like my cat.', '我喜欢我的猫。']
    ], q: '这篇里的小猫是什么样的？', o: ['小小的', '大大的'], a: 0 },
    { t: 'My Dog', p: 'dog', l: [
      ['I have a dog.', '我有一只狗。'],
      ['It is brown.', '它是棕色的。'],
      ['It can run fast.', '它跑得很快。'],
      ['We play together.', '我们一起玩。']
    ], q: '小狗会做什么？', o: ['跑得很快', '飞得很高'], a: 0 },
    { t: 'I Am Six', p: 'six', l: [
      ['I am Lili.', '我是丽丽。'],
      ['I am six.', '我六岁了。'],
      ['I am a pupil.', '我是一名小学生。'],
      ['I go to school.', '我上学。']
    ], q: '我几岁了？', o: ['六岁', '九岁'], a: 0 },
    { t: 'My Family', p: 'star', l: [
      ['This is my family.', '这是我的家。'],
      ['This is my mum.', '这是我妈妈。'],
      ['This is my dad.', '这是我爸爸。'],
      ['I love them.', '我爱他们。']
    ], q: '家里都有谁？', o: ['爸爸和妈妈', '老师和同学'], a: 0 },
    { t: 'My Mum', p: 'star', l: [
      ['My mum is kind.', '我妈妈很和气。'],
      ['She can cook.', '她会做饭。'],
      ['She likes flowers.', '她喜欢花。'],
      ['I love my mum.', '我爱我妈妈。']
    ], q: '妈妈会做什么？', o: ['做饭', '开车'], a: 0 },
    { t: 'My Dad', p: 'star', l: [
      ['My dad is tall.', '我爸爸很高。'],
      ['He can drive.', '他会开车。'],
      ['He likes tea.', '他喜欢喝茶。'],
      ['I love my dad.', '我爱我爸爸。']
    ], q: '爸爸是什么样的？', o: ['高高的', '矮矮的'], a: 0 },
    { t: 'At School', p: 'school', l: [
      ['I go to school.', '我去上学。'],
      ['I sit at my desk.', '我坐在课桌前。'],
      ['I listen to my teacher.', '我听老师讲课。'],
      ['School is fun.', '学校真有意思。']
    ], q: '我在学校做什么？', o: ['听老师讲课', '睡大觉'], a: 0 },
    { t: 'My Bag', p: 'bag', l: [
      ['This is my bag.', '这是我的书包。'],
      ['It is blue.', '它是蓝色的。'],
      ['My books are in it.', '我的书在里面。'],
      ['I take it to school.', '我背着它上学。']
    ], q: '书包里有什么？', o: ['书', '小猫'], a: 0 },
    { t: 'A Red Apple', p: 'apple', l: [
      ['Look at the apple.', '看这个苹果。'],
      ['It is red.', '它是红色的。'],
      ['It is round.', '它是圆圆的。'],
      ['I want to eat it.', '我想吃掉它。']
    ], q: '苹果是什么颜色的？', o: ['红色', '蓝色'], a: 0 },
    { t: 'I Like Bananas', p: 'banana', l: [
      ['I like bananas.', '我喜欢香蕉。'],
      ['They are yellow.', '它们是黄色的。'],
      ['They are sweet.', '它们很甜。'],
      ['I eat one every day.', '我每天吃一根。']
    ], q: '香蕉是什么颜色的？', o: ['黄色', '黑色'], a: 0 },
    { t: 'The Sun', p: 'sun', l: [
      ['The sun is up.', '太阳出来了。'],
      ['It is hot today.', '今天很热。'],
      ['The sky is blue.', '天空蓝蓝的。'],
      ['I can play outside.', '我可以出去玩。']
    ], q: '今天天气怎么样？', o: ['很热', '很冷'], a: 0 },
    { t: 'Rain', p: 'rain', l: [
      ['It is raining.', '下雨了。'],
      ['I take my umbrella.', '我带上伞。'],
      ['The grass is wet.', '草湿了。'],
      ['I like the rain.', '我喜欢下雨。']
    ], q: '下雨要带什么？', o: ['伞', '帽子'], a: 0 },
    { t: 'A Bird', p: 'bird', l: [
      ['A bird is in the tree.', '树上有一只鸟。'],
      ['It can sing.', '它会唱歌。'],
      ['It can fly.', '它会飞。'],
      ['I like to listen.', '我喜欢听它唱。']
    ], q: '小鸟在哪儿？', o: ['树上', '水里'], a: 0 },
    { t: 'A Fish', p: 'fish', l: [
      ['I have a fish.', '我有一条鱼。'],
      ['It is orange.', '它是橙色的。'],
      ['It can swim.', '它会游泳。'],
      ['It lives in water.', '它住在水里。']
    ], q: '小鱼会做什么？', o: ['游泳', '跑步'], a: 0 },
    { t: 'My Room', p: 'bed', l: [
      ['This is my room.', '这是我的房间。'],
      ['My bed is here.', '我的床在这儿。'],
      ['My lamp is here too.', '台灯也在这儿。'],
      ['I like my room.', '我喜欢我的房间。']
    ], q: '房间里有什么？', o: ['床和台灯', '小汽车'], a: 0 },
    { t: 'My Bed', p: 'bed', l: [
      ['I go to bed.', '我上床睡觉。'],
      ['My bed is soft.', '我的床软软的。'],
      ['I close my eyes.', '我闭上眼睛。'],
      ['Good night.', '晚安。']
    ], q: '我上床做什么？', o: ['睡觉', '吃饭'], a: 0 },
    { t: 'I Can Run', p: 'run', l: [
      ['I can run.', '我会跑。'],
      ['I can jump.', '我会跳。'],
      ['I can play.', '我会玩。'],
      ['I am happy.', '我很开心。']
    ], q: '我会做什么？', o: ['跑和跳', '飞'], a: 0 },
    { t: 'I Can Jump', p: 'jump', l: [
      ['Look at me!', '看着我！'],
      ['I can jump high.', '我能跳得很高。'],
      ['One, two, three!', '一、二、三！'],
      ['It is fun.', '真好玩。']
    ], q: '我跳得怎么样？', o: ['很高', '很低'], a: 0 },
    { t: 'A Big Tree', p: 'tree', l: [
      ['There is a big tree.', '有一棵大树。'],
      ['It is tall.', '它很高。'],
      ['Birds live in it.', '小鸟住在上面。'],
      ['I sit under it.', '我坐在下面。']
    ], q: '这棵树是什么样的？', o: ['又大又高', '又小又矮'], a: 0 },
    { t: 'Flowers', p: 'flower', l: [
      ['Look at the flowers.', '看那些花。'],
      ['They are red and yellow.', '有红的也有黄的。'],
      ['They smell nice.', '它们很香。'],
      ['I like flowers.', '我喜欢花。']
    ], q: '花是什么颜色的？', o: ['红色和黄色', '黑色和白色'], a: 0 },
    { t: 'My Car', p: 'car', l: [
      ['I have a toy car.', '我有一辆玩具车。'],
      ['It is red.', '它是红色的。'],
      ['It can go fast.', '它跑得很快。'],
      ['I play with it.', '我玩它。']
    ], q: '我的小车是什么车？', o: ['玩具车', '真正的汽车'], a: 0 },
    { t: 'The Bus', p: 'bus', l: [
      ['The bus is big.', '公交车很大。'],
      ['It is yellow.', '它是黄色的。'],
      ['I go to school by bus.', '我坐公交车上学。'],
      ['The bus goes beep-beep.', '公交车嘀嘀响。']
    ], q: '公交车是什么样的？', o: ['又大又黄', '又小又蓝'], a: 0 },
    { t: 'My Teacher', p: 'teacher', l: [
      ['This is my teacher.', '这是我的老师。'],
      ['She is kind.', '她很和气。'],
      ['She reads to us.', '她读书给我们听。'],
      ['I like my teacher.', '我喜欢我的老师。']
    ], q: '老师怎么样？', o: ['很和气', '很凶'], a: 0 },
    { t: 'My Friend', p: 'student', l: [
      ['This is my friend.', '这是我的朋友。'],
      ['His name is Tom.', '他叫汤姆。'],
      ['We play together.', '我们一起玩。'],
      ['We are happy.', '我们很开心。']
    ], q: '我和朋友一起做什么？', o: ['一起玩', '一起哭'], a: 0 },
    { t: 'Happy Me', p: 'star', l: [
      ['I am happy today.', '我今天很开心。'],
      ['The sun is up.', '太阳出来了。'],
      ['I play with my friends.', '我和朋友一起玩。'],
      ['It is a good day.', '今天是美好的一天。']
    ], q: '我今天心情怎么样？', o: ['很开心', '很难过'], a: 0 }
  ]
};

/* ================================================================
   一年级英语视图
   单向渲染：EG1_render 只负责画 DOM，不回头调任何别的渲染函数；
   需要「整页刷新」时统一在事件里走主文件的 switchTab('english')。
   ================================================================ */
(function () {
  'use strict';
  var A = window.EN_G1;
  /* 每组主题词一个专属配色（去单调：不同主题一眼分得清，不再一片蓝） */
  var THEME_COLORS = ['#4DABF7', '#FF922B', '#51CF66', '#CC5DE8', '#FF6B6B', '#20C997',
                      '#FAB005', '#845EF7', '#22B8CF', '#E64980', '#82C91E', '#FD7E14', '#4C6EF5',
                      /* v4.182：第 14 组（职业）专用深青绿，跟第 6 组的薄荷绿拉开 */
                      '#0CA678'];
  function themeColor(i) { return THEME_COLORS[((i % THEME_COLORS.length) + THEME_COLORS.length) % THEME_COLORS.length]; }
  var SUB = 'listen';        /* listen 听说 | letter 字母 | word 单词 */
  var openSong = -1;         /* 展开到第几首儿歌 */
  var songIdx = -1;          /* 正在播放的儿歌 */
  var songLine = -1;         /* 正在播放的第几句 */
  var songTimer = null;
  var openFam = '';          /* 展开的词族 */
  var themeIdx = 0;          /* 当前主题词组 */
  var quiz = null;           /* 听音选词的当前题 */
  var quizTip = '';          /* 答题后的反馈 */
  /* v4.225：练习场（题型 / 范围 / 题数）+ 字母小测 + 资料册 */
  var QMODES = [['listen', '听音选词'], ['pic', '看图选词'], ['zh2en', '中译英'], ['en2zh', '英译中']];
  var qmode = 'listen';      /* listen 听音 | pic 看图 | zh2en 中译英 | en2zh 英译中 */
  var qscope = 'all';        /* 'all' = 110 词全要；否则是主题词组序号 */
  var qtotal = 5;            /* 一轮 5 / 10 题 */
  var ltr = null;            /* 字母小测当前题 */
  var ltrTip = '';
  /* v4.226：迷你对话 / 小故事 */
  var openDlg = -1;          /* 展开到第几组对话 */
  var dlgTimer = null;
  var storyIdx = -1;         /* 展开到第几篇小故事 */
  var storyLine = -1;        /* 正在念第几句 */
  var storyTimer = null;
  var storyTip = '';
  var storyAns = {};         /* 每篇故事的读后题答了哪个（篇号 → 选项序号） */

  /* ---------- 样式（只注入一次） ---------- */
  function ensureCss() {
    if (document.getElementById('eg1-css')) return;
    var st = document.createElement('style');
    st.id = 'eg1-css';
    st.textContent =
      '.eg1-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(94px,1fr));gap:11px}' +
      '.eg1-card{background:#fff;border:3px solid var(--blue-l);border-radius:18px;padding:12px 6px;text-align:center;' +
      'min-height:100px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;box-shadow:var(--shadow)}' +
      '.eg1-card:active{transform:translateY(3px)}' +
      '.eg1-up{font-size:30px;font-weight:800;color:var(--blue);line-height:1.1;letter-spacing:1px}' +
      '.eg1-pic-wrap{display:block;width:48px;height:48px;margin:0 auto 4px}' +
      '.eg1-pic{display:block;width:100%;height:100%}' +
      '.eg1-snd{font-size:12.5px;font-weight:800;color:var(--purple)}' +
      '.eg1-ex{font-size:14px;font-weight:700;color:#5B6478}' +
      '.eg1-lzh{display:block;font-size:13.5px;font-weight:800;color:#E8590C;line-height:1.5;margin-top:2px}' +
      '.eg1-wzh{display:block;font-size:13px;font-weight:700;color:#8A8FA3;margin-top:4px;line-height:1.3}' +
      '.eg1-card.on{border-color:var(--yellow);background:var(--yellow-l)}' +
      '.eg1-row{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:16px;background:#F6FBFF;' +
      'border:2.5px solid #E7F0FA;margin-bottom:10px;min-height:62px;width:100%;text-align:left}' +
      '.eg1-row:active{transform:translateY(2px)}' +
      '.eg1-en{font-size:18.5px;font-weight:800;color:var(--ink);line-height:1.3}' +
      '.eg1-zh{font-size:13px;color:#8A8FA3;font-weight:700;margin-top:2px}' +
      '.eg1-act{margin-left:auto;flex-shrink:0;font-size:12.5px;font-weight:800;color:#1FA953;background:var(--green-l);' +
      'border-radius:999px;padding:5px 10px;white-space:nowrap}' +
      '.eg1-song{border-radius:20px;background:#fff;border:3px solid var(--purple-l);margin-bottom:12px;overflow:hidden}' +
      '.eg1-song-head{display:flex;align-items:center;gap:10px;padding:14px 16px;min-height:62px;width:100%;text-align:left}' +
      /* v4.226：可点的行（对话的一句 / 故事的一句）和 A/B 角色小标签 */
      '.eg1-tap{display:block;width:100%;text-align:left;background:#fff;border:2px solid #E7F0FA;border-radius:12px;' +
      'margin:6px 0;padding:9px 11px;font-size:16px;font-weight:700;color:var(--ink);line-height:1.5}' +
      '.eg1-tap:active{transform:translateY(2px)}' +
      '.eg1-who{display:inline-block;min-width:24px;text-align:center;font-size:12px;font-weight:800;color:#fff;' +
      'background:#4DABF7;border-radius:999px;padding:2px 8px;margin-right:8px;vertical-align:1px}' +
      '.eg1-who.b{background:#FF7E9D}' +
      '.eg1-song .eg1-lines{display:none;padding:6px 16px 16px;border-top:2.5px dashed var(--purple-l)}' +
      '.eg1-song.open .eg1-lines{display:block}' +
      '.eg1-line{padding:8px 10px;border-radius:12px;font-size:16.5px;font-weight:800;line-height:1.6;color:var(--ink)}' +
      '.eg1-line .eg1-lact{display:block;font-size:12.5px;color:#1FA953;font-weight:800;margin-top:1px}' +
      '.eg1-line.on{background:var(--yellow-l)}' +
      '.eg1-fams{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:4px}' +
      '.eg1-fam{min-height:44px;padding:10px 16px;border-radius:999px;font-size:15px;font-weight:800;color:var(--ink-2);' +
      'background:#fff;border:2.5px solid #E3ECFA}' +
      '.eg1-fam.on{background:var(--yellow-l);border-color:var(--yellow);color:#8B6914}' +
      '.eg1-words{display:flex;flex-wrap:wrap;gap:10px;margin-top:10px}' +
      '.eg1-w{min-height:52px;padding:11px 18px;border-radius:16px;background:#fff;border:3px solid var(--blue-l);' +
      'font-size:18px;font-weight:800;color:var(--blue);display:flex;flex-direction:column;align-items:center;justify-content:center}' +
      '.eg1-w i{font-style:normal;font-size:13px;color:#5B6478;font-weight:700}' +
      '.eg1-tip{font-size:14px;font-weight:700;color:var(--ink-2);text-align:center;margin-top:10px;line-height:1.6}';
    document.head.appendChild(st);
  }

  /* ---------- 朗读：英文/中文都优先走「媒体通道」（蓝牙有声），失败退回系统 TTS ----------
     ★ v4.175 修复（家长实测：英语板块声音不走蓝牙，其他板块正常）
     根因：英语是本内容包里新写的模块，朗读**裸调 speechSynthesis**；
           而 iOS 只把「媒体音频」送到蓝牙 A2DP，speechSynthesis 是系统语音通道，
           网页侧没有任何 API 能让它走蓝牙（v4.115/v4.116 试过保活，均无效）。
           语文/古诗/拼音早在 v4.119 就改为「在线合成 mp3 → <audio>」，所以它们有蓝牙。
     解法：英语同样走媒体通道，但用**英语发音人**（lan=en），
           与拼音真人录音同一条通道 → 蓝牙必定有声。
     兜底：断网 / 接口被限 → 自动退回系统 TTS（至少不哑巴，绝不比改前更差）。

     ★ v4.177：新增中文发音人（lan=zh），用于把「中文意思」也念出来，
       让零基础孩子和家长都能听懂（点读词卡/字母/儿歌/日常句都会 英文→中文）。 */

  /* 英语在线合成地址。与主文件的 ONLINE_TTS 是同一接口，只是把 lan 换成 en。 */
  function eg1TtsUrl(text) {
    return 'https://fanyi.baidu.com/gettts?lan=en&spd=5&source=web&text=' +
      encodeURIComponent(String(text == null ? '' : text));
  }
  /* 中文在线合成地址（同一接口，lan=zh）。 */
  function eg1TtsUrlZh(text) {
    return 'https://fanyi.baidu.com/gettts?lan=zh&spd=5&source=web&text=' +
      encodeURIComponent(String(text == null ? '' : text));
  }
  /* 家长在设置里关掉在线语音时，这里也跟着关（统一听同一个开关）。 */
  function eg1OnlineOn() {
    try { return typeof ONLINE_TTS_ON === 'undefined' ? true : !!ONLINE_TTS_ON; } catch (e) { return true; }
  }

  var EG1_AUDIO = null;

  /* 停掉媒体播放。必须在切页/暂停/重播前调用，否则上一段音频会叠着播。 */
  function eg1AudioStop() {
    try {
      if (EG1_AUDIO) {
        var a = EG1_AUDIO; EG1_AUDIO = null;
        try { a.onended = null; a.onerror = null; a.onplaying = null; } catch (e) {}
        try { a.pause(); } catch (e) {}
        try { a.src = ''; a.load(); } catch (e) {}
      }
    } catch (e) {}
    /* 主文件的媒体通道也可能正在放，一并停掉 */
    try { if (typeof speakAudioStop === 'function') speakAudioStop(); } catch (e) {}
  }

  /* 用 <audio> 在线合成播一句。urlFn 决定中/英发音人（默认英语）。
     onOk=播完，onBad=起播失败（交给上层降级）。 */
  function eg1PlayAudio(text, onOk, onBad, urlFn) {
    var a, url;
    try { url = (urlFn || eg1TtsUrl)(text); } catch (e) { if (onBad) onBad(); return; }
    try {
      a = new Audio();
      /* ★ 必须在赋 src 之前设 referrerpolicy：
         语音接口有防盗链，请求一旦带 Referer 就返回空内容（实测 200 + 0 字节）。 */
      try { a.setAttribute('referrerpolicy', 'no-referrer'); } catch (e) {}
      a.preload = 'auto';
      a.src = url;
    } catch (e) { if (onBad) onBad(); return; }

    var done = false, played = false, guard = null;
    var fin = function (ok) {
      if (done) return; done = true;
      try { a.onended = null; a.onerror = null; a.onplaying = null; } catch (e) {}
      try { if (guard) clearTimeout(guard); } catch (e) {}
      if (EG1_AUDIO === a) EG1_AUDIO = null;
      /* ★ 播完必须真正释放：iOS 对同时存在的音频元素有数量上限，
         不显式 src='' + load()，点几十次后新建的 <audio> 会静默失效。 */
      try { a.pause(); } catch (e) {}
      try { a.src = ''; a.load(); } catch (e) {}
      if (ok) { if (onOk) onOk(); } else { if (onBad) onBad(); }
    };
    /* 起播超时：2.6 秒还没出声（多半断网/接口被限）→ 判失败，走上层降级 */
    var loadGuard = setTimeout(function () { if (!played) fin(false); }, 2600);
    a.onplaying = function () {
      played = true; clearTimeout(loadGuard);
      /* 总时长兜底：个别机型 onended 不来，按字符数估上限，别把整串卡死 */
      guard = setTimeout(function () { fin(true); }, Math.max(3000, String(text).length * 380 + 1200));
    };
    a.onended = function () { fin(true); };
    a.onerror = function () { fin(false); };
    EG1_AUDIO = a;
    try {
      var pr = a.play();
      if (pr && pr.catch) pr.catch(function () { clearTimeout(loadGuard); fin(false); });
    } catch (e) { clearTimeout(loadGuard); fin(false); }
  }

  /* ---------- 中文发音（给家长/孩子"听懂"用）：同样走媒体通道，lan=zh ---------- */
  /* 念一句中文：媒体通道 → 失败退回系统 TTS(zh-CN)。 */
  function sayZh(txt, cb) {
    var t = String(txt == null ? '' : txt);
    stopSay();   /* ★ v4.181：任意新朗读前先打断上一句，避免连按两次声音叠加 */
    if (!t.replace(/\s/g, '')) { if (cb) cb(); return; }
    if (eg1OnlineOn()) {
      eg1PlayAudio(t, function () { if (cb) cb(); }, function () {
        sysSayZh(t, cb);   /* 网络不通 → 系统中文 TTS 兜住 */
      }, eg1TtsUrlZh);
      return;
    }
    sysSayZh(t, cb);
  }
  /* 系统中文 TTS 兜底（离线可用，但 iOS 上不走蓝牙，同英语系统通道） */
  function sysSayZh(txt, cb) {
    try {
      if (!('speechSynthesis' in window)) { if (cb) cb(); return; }
      var go = function () {
        try { window.speechSynthesis.cancel(); } catch (e) {}
        var u = new SpeechSynthesisUtterance(String(txt || ''));
        u.lang = 'zh-CN'; u.rate = 0.95; u.pitch = 1; u.volume = 1;
        try { if (typeof pickVoice === 'function') { var v = pickVoice('zh-CN'); if (v) u.voice = v; } } catch (e) {}
        var fin = false;
        u.onend = function () { if (fin) return; fin = true; if (cb) cb(); };
        u.onerror = function () { if (fin) return; fin = true; if (cb) cb(); };
        window.speechSynthesis.speak(u);
      };
      if (typeof primeForTTS === 'function') primeForTTS(go); else go();
    } catch (e) { if (cb) cb(); }
  }

  /* 读一句英语（总入口）：媒体通道 → 失败退回系统 TTS。 */
  function sayOne(txt, rate, cb) {
    var t = String(txt == null ? '' : txt);
    stopSay();   /* ★ v4.181：任意新朗读前先打断上一句，避免连按两次声音叠加 */
    if (!t.replace(/\s/g, '')) { if (cb) cb(); return; }
    if (eg1OnlineOn()) {
      eg1PlayAudio(t, function () { if (cb) cb(); }, function () {
        sysSayOne(t, rate, cb);   /* 网络不通 → 立刻用系统 TTS 兜住，不哑巴 */
      });
      return;
    }
    sysSayOne(t, rate, cb);
  }

  /* ---------- 系统 TTS 兜底（原实现，保留）：纯离线可用，但 iOS 上不走蓝牙 ---------- */
  /* ★ v4.175：stopSay 现在两条通道一起停。
     把它做成「全部停」，是为了让所有原有的 stopSay() 调用点（暂停、停歌、切页）
     不用逐个去改，就自动把媒体通道的音频也停掉 —— 否则会出现
     「按了停一下，系统 TTS 停了但在线合成的音频还在响」。 */
  function stopSay() {
    eg1AudioStop();
    try { window.speechSynthesis.cancel(); } catch (e) {}
  }
  function sysSayOne(txt, rate, cb) {
    try {
      if (!('speechSynthesis' in window)) { if (cb) cb(); return; }
      var go = function () {
        try { window.speechSynthesis.cancel(); } catch (e) {}
        var u = new SpeechSynthesisUtterance(String(txt || ''));
        u.lang = 'en-US'; u.rate = rate || 0.85; u.pitch = 1; u.volume = 1;
        try { if (typeof pickVoice === 'function') { var v = pickVoice('en-US'); if (v) u.voice = v; } } catch (e) {}
        var fin = false;
        u.onend = function () { if (fin) return; fin = true; if (cb) cb(); };
        u.onerror = function () { if (fin) return; fin = true; if (cb) cb(); };
        window.speechSynthesis.speak(u);
      };
      if (typeof primeForTTS === 'function') primeForTTS(go); else go();
    } catch (e) { if (cb) cb(); }
  }
  /* 逐句/逐个念：前者念完停顿 gap 毫秒再念下一个 */
  function speakSeq(list, gap, rate, done) {
    var i = 0;
    function next() {
      if (i >= list.length) { if (done) done(); return; }
      var t = list[i++];
      sayOne(t, rate, function () { setTimeout(next, gap == null ? 420 : gap); });
    }
    next();
  }
  /* 给主文件用：错题本里的英语错题也能正确念出来 */
  window.EG1_say = function (txt, rate) { sayOne(txt, rate || 0.85); };
  /* ★ v4.175：带回调版本 —— 主文件的「英语课文」需要「念完一句再念下一句」，
     必须能拿到「读完了」的通知，否则只能盲等固定时长，停顿会不均匀。
     cb 在播完时调用；无论走媒体通道还是系统 TTS 兜底，都保证会回调一次。 */
  window.EG1_sayCb = function (txt, rate, cb) {
    var guardDone = false;
    var fin = function () { if (guardDone) return; guardDone = true; if (cb) { try { cb(); } catch (e) {} } };
    /* 兜底超时：万一两条通道的回调都没来（个别机型），也不能把整篇卡死 */
    var t = String(txt == null ? '' : txt);
    setTimeout(fin, Math.min(15000, Math.max(3000, t.length * 400 + 1500)));
    sayOne(t, rate || 0.85, fin);
  };
  window.EG1_saySeq = function (list, gap, rate) { speakSeq(list, gap, rate); };
  /* ★ v4.175：停的时候两条通道都要停 —— 媒体通道的音频和系统 TTS 都可能正在响 */
  window.EG1_stop = function () { eg1AudioStop(); stopSay(); };

  /* 逐字母拼读再整词：C-A-T … cat（一年级常用的拼写法）；最后念中文意思 */
  function spellThenSay(word, zh, done) {
    var chs = String(word || '').toLowerCase().replace(/[^a-z]/g, '').split('');
    if (!chs.length) { if (zh) sayZh(zh, done); else if (done) done(); return; }
    speakSeq(chs, 260, 0.7, function () {
      setTimeout(function () { sayOne(word, 0.8, function () {
        if (zh) setTimeout(function () { sayZh(zh, done); }, 300); else if (done) done();
      }); }, 260);
    });
  }

  /* ---------- 工具 ---------- */
  function groups() {
    var seen = [], out = [];
    (A.routine || []).forEach(function (r) { if (seen.indexOf(r.g) < 0) { seen.push(r.g); out.push(r.g); } });
    return out;
  }
  function shuffleArr(a) {
    var x = a.slice();
    for (var i = x.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = x[i]; x[i] = x[j]; x[j] = t; }
    return x;
  }
  function allWords() {
    var pool = [];
    (A.themes || []).forEach(function (t) { t.w.forEach(function (p) { pool.push(p); }); });
    return pool;
  }
  /* 整页重画（事件里统一走主文件的入口，不在这里互相调渲染） */
  function refresh() { try { switchTab('english'); } catch (e) {} }

  /* ---------- 各块 HTML ---------- */
  function subTabsHTML() {
    var tabs = [['listen', '生活口语'], ['letter', '字母'], ['word', '单词 · 游戏'], ['story', '小故事']];
    return '<div class="mode-tabs">' + tabs.map(function (m) {
      return '<button class="mode-tab' + (SUB === m[0] ? ' active' : '') + '" data-action="eg1-sub" data-m="' + m[0] + '"' +
        (SUB === m[0] ? ' style="background:var(--blue)"' : '') + '>' + m[1] + '</button>';
    }).join('') + '</div>';
  }

  function listenHTML() {
    /* v4.181：儿歌下架（机器念歌词终究不像歌），主线改成「自我介绍 + 生活交流」 */
    var h = '<div class="card" style="border-color:var(--purple-l)">' +
      '<div class="tc-head" style="display:flex;align-items:center;gap:8px">' + icon('sparkle', 26, '#9775FA') + '<span>自我介绍 · 先听熟</span></div>' +
      '<div class="admin-tip" style="margin:0 0 10px">点一句：<b>先念英文、再念中文</b>（小字）。' +
      '这些就是<b>人教 PEP 三年级上册第一单元</b>要说的话，现在听熟，将来正式学到就是复习。' +
      '<b>不要求背</b>，听得多了她自然会跟着说。名字用的是化名，想换成她自己的名字跟我说一声。</div>' +
      '<div class="eg1-words">' + (A.intro || []).map(function (p, i) {
        return '<button type="button" class="eg1-row" data-action="eg1-intro" data-i="' + i + '">' +
          '<span class="eg1-en">' + esc(p.en) + '<span class="eg1-zh">' + esc(p.zh) + '</span></span>' +
          '<span class="eg1-act">' + esc(p.tip) + '</span></button>';
      }).join('') + '</div></div>';
    h += '<div class="card" style="border-color:var(--green-l)">' +
      '<div class="tc-head" style="display:flex;align-items:center;gap:8px">' + icon('check', 26, '#1FA953') + '<span>生活交流 · 边说边做</span></div>' +
      '<div class="admin-tip" style="margin:0 0 10px">全是她<b>生活里真会碰到</b>的场合：玩、家人、求助、上学、天气、睡前。' +
      '点一行<b>先念英文、再念中文</b>。<b>不考她</b>，说不上来没关系——你在对应场合说一句、做一下动作，她慢慢就跟着来了。</div>';
    groups().forEach(function (g) {
      h += '<div class="py-group-title" style="margin:12px 2px 8px">' + icon('sparkle', 16, '#FFB93C') + esc(g) + '</div>';
      h += A.routine.filter(function (r) { return r.g === g; }).map(function (r, i) {
        var idx = A.routine.indexOf(r);
        return '<button type="button" class="eg1-row" data-action="eg1-say" data-i="' + idx + '">' +
          '<span class="eg1-en">' + esc(r.en) + '<span class="eg1-zh">' + esc(r.zh) + '</span></span>' +
          '<span class="eg1-act">' + esc(r.act) + '</span></button>';
      }).join('');
    });
    /* v4.226：迷你对话 30 组 —— 原来 78 句口语全是单句，没有一来一往的对话 */
    h += dlgHTML();
    return h + '</div>';
  }
  /* 迷你对话：点「整段听」整段念，也可以点某一句单独听 */
  function dlgHTML() {
    var n = (A.dlg || []).length;
    if (!n) return '';
    var h = '<div class="card" style="border-color:var(--blue-l)">' +
      '<div class="tc-head" style="display:flex;align-items:center;gap:8px">' + icon('sound', 26, '#4DABF7') + '<span>迷你对话 · ' + n + ' 组</span></div>' +
      '<div class="admin-tip" style="margin:0 0 10px">两个人<b>一来一往</b>地说话，比单句更像真的在聊天。' +
      '点开一组，先「整段听」听一遍，再<b>点某一句</b>单独听；你念 A、她念 B，玩着玩着就会了。</div>' +
      '<div id="eg1-dlgbox">' + dlgInnerHTML() + '</div></div>';
    return h;
  }
  function dlgInnerHTML() {
    return (A.dlg || []).map(function (d, i) {
      var open = openDlg === i;
      var h = '<div class="eg1-song' + (open ? ' open' : '') + '">' +
        '<button type="button" class="eg1-song-head" data-action="eg1-dlg" data-i="' + i + '">' +
        '<span class="eg1-en">' + esc(d.s) + '<span class="eg1-zh">共 ' + d.l.length + ' 句</span></span>' +
        '<span class="eg1-act" style="margin-left:auto">' + (open ? '收起' : '展开') + '</span></button>';
      if (open) {
        h += '<div class="eg1-lines">' + d.l.map(function (p, k) {
          return '<button type="button" class="eg1-tap" data-action="eg1-dlg-line" data-i="' + i + '" data-k="' + k + '">' +
            '<span class="eg1-who' + (p[0] === 'B' ? ' b' : '') + '">' + esc(p[0]) + '</span>' +
            esc(p[1]) + '<span class="eg1-lzh">' + esc(p[2]) + '</span></button>';
        }).join('') +
          '<div class="poem-actions" style="margin-top:10px">' +
          '<button class="quiz-audio" style="margin:0" data-action="eg1-dlg-play" data-i="' + i + '">' + icon('sound', 20) + ' 整段听</button>' +
          '</div></div>';
      }
      return h + '</div>';
    }).join('');
  }
  function repaintDlg() {
    var box = document.getElementById('eg1-dlgbox');
    if (box) box.innerHTML = dlgInnerHTML();
    else refresh();
  }
  /* 整段听：一句英文 → 一句中文 → 停一下 → 下一句 */
  function playDlg(i) {
    var d = (A.dlg || [])[i]; if (!d) return;
    stopSay();
    openDlg = i;
    var k = 0;
    var step = function () {
      if (openDlg !== i) return;
      if (k >= d.l.length) { dlgTimer = null; repaintDlg(); return; }
      var cur = d.l[k];
      sayOne(cur[1], 0.82, function () {
        if (openDlg !== i) return;
        setTimeout(function () {
          if (openDlg !== i) return;
          sayZh(cur[2], function () {
            dlgTimer = setTimeout(function () { k++; step(); }, 700);
          });
        }, 260);
      });
    };
    repaintDlg();
    step();
  }
  function songsInnerHTML() {
    return (A.songs || []).map(function (s, i) {
      var open = openSong === i;
      var playing = songIdx === i;
      return '<div class="eg1-song' + (open ? ' open' : '') + '">' +
        '<button type="button" class="eg1-song-head" data-action="eg1-song" data-i="' + i + '">' +
        '<span class="eg1-en">' + esc(s.t) + '<span class="eg1-zh">' + esc(s.s) + '</span></span>' +
        '<span class="eg1-act" style="margin-left:auto">' + (open ? '收起' : '展开') + '</span></button>' +
        '<div class="eg1-lines">' +
        s.l.map(function (l, k) {
          var playingNow = playing && songLine === k;
          return '<div class="eg1-line' + (playingNow ? ' on' : '') + '">' +
            (playingNow ? '🔊 ' : '') + esc(l[0]) +
            '<span class="eg1-lzh">' + esc(l[1]) + '</span>' +
            '<span class="eg1-lact">' + esc(l[2]) + '</span></div>';
        }).join('') +
        '<div class="poem-actions" style="margin-top:12px">' +
        (playing
          ? '<button class="quiz-audio" style="margin:0" data-action="eg1-song-stop">' + icon('stop', 20) + ' 停一下</button>'
          : '<button class="quiz-audio" style="margin:0" data-action="eg1-song-play" data-i="' + i + '">' + icon('sound', 20) + ' 跟着唱</button>') +
        '</div></div></div>';
    }).join('');
  }

  function letterHTML() {
    var h = '<div class="card" style="border-color:var(--blue-l)">' +
      '<div class="tc-head" style="display:flex;align-items:center;gap:8px">' + icon('sparkle', 26, '#4DABF7') + '<span>26 个字母</span></div>' +
      '<div class="admin-tip" style="margin:0 0 10px">点一个字母：先念<b>字母名</b>，再念<b>例词</b>（例词的开头音就是它的字母音），最后念<b>中文意思</b>。' +
      '<b>一年级不学音标</b>，能听出名字和发音不一样就够了。</div>' +
      '<div class="eg1-grid">' + (A.letters || []).map(function (L, i) {
        return '<button type="button" class="eg1-card" data-action="eg1-letter" data-i="' + i + '">' +
          '<span class="eg1-up">' + esc(L[0].toUpperCase()) + esc(L[0]) + '</span>' +
          '<span class="eg1-ex">' + esc(L[3]) + ' · ' + esc(L[4]) + '</span></button>';
      }).join('') + '</div></div>';

    h += '<div class="card" style="border-color:var(--yellow-l)">' +
      '<div class="tc-head" style="display:flex;align-items:center;gap:8px">' + icon('pen', 26, '#FFB93C') + '<span>最短的词 · 一听就会</span></div>' +
      '<div class="admin-tip" style="margin:0 0 10px">只用 a s t p i n 六个音就能说全的一批短词（sat / pin / tap），最容易上口。' +
      '点一下<b>直接读整词</b>，不拆字母——先听熟，比一个个字母拼着念更有语感。</div>' +
      '<div class="eg1-words">' + (A.first || []).map(function (p, i) {
        return '<button type="button" class="eg1-w" data-action="eg1-first" data-i="' + i + '">' +
          esc(p[3]) + '<i>' + esc(p[4]) + '</i></button>';
      }).join('') + '</div></div>';

    /* v4.182：词族卡单独一个容器 —— 展开/收起只重画这一块，不再整页 refresh（原来会弹回页面顶部） */
    h += '<div class="card" style="border-color:var(--green-l)" id="eg1-cvcbox">' + cvcBoxHTML() + '</div>';
    /* v4.225：字母小测（听字母名选字母，10 题一轮） */
    h += '<div class="card" style="border-color:var(--yellow-l)" id="eg1-ltrbox">' + ltrBoxHTML() + '</div>';
    return h + '</div>';
  }
  /* 词族卡内部 HTML（展开/收起时局部重画用，页面不跳） */
  function cvcBoxHTML() {
    var h = '<div class="tc-head" style="display:flex;align-items:center;gap:8px">' + icon('book', 26, '#1FA953') + '<span>词族 · 换头不换尾</span></div>' +
      '<div class="admin-tip" style="margin:0 0 10px">同一个尾巴（比如 -at）换不同的开头，就能读出一大串词。点词族展开，再点单词听。</div>' +
      '<div class="eg1-fams">' + (A.cvc || []).map(function (c) {
        return '<button type="button" class="eg1-fam' + (openFam === c.f ? ' on' : '') + '" data-action="eg1-fam" data-f="' + esc(c.f) + '">-' + esc(c.f) + '</button>';
      }).join('') + '</div>';
    if (openFam) {
      var fam = null;
      (A.cvc || []).forEach(function (c) { if (c.f === openFam) fam = c; });
      if (fam) {
        h += '<div class="eg1-words">' + fam.w.map(function (p) {
          return '<button type="button" class="eg1-w" data-action="eg1-word" data-w="' + esc(p[0]) + '" data-z="' + esc(p[1]) + '">' +
            esc(p[0]) + '<i>' + esc(p[1]) + '</i></button>';
        }).join('') + '</div>' +
          /* v4.182：删掉"一个字母一个字母拼"的旧说法（早就不拼读了） */
          '<div class="eg1-tip">点单词：<b>直接读出来</b>，不用一个字母一个字母拼。</div>';
      }
    }
    return h;
  }
  function repaintCvc() {
    var box = document.getElementById('eg1-cvcbox');
    if (box) box.innerHTML = cvcBoxHTML();
  }

  /* ---------- v4.225 字母小测：听字母名选字母，10 题一轮 ---------- */
  function ltrBoxHTML() {
    return '<div class="tc-head" style="display:flex;align-items:center;gap:8px">' + icon('sparkle', 26, '#FFB93C') + '<span>字母小测</span></div>' +
      '<div class="admin-tip" style="margin:0 0 10px">听一个<b>字母的名字</b>，从四个里挑出来。<b>不写、不背</b>，听着玩就行。</div>' +
      '<div id="eg1-ltr">' + ltrInnerHTML() + '</div>';
  }
  function ltrInnerHTML() {
    if (!ltr) {
      return '<div class="eg1-tip">点下面开始，一共 10 题。</div>' +
        '<div style="text-align:center;margin-top:10px"><button class="quiz-audio" style="margin:0" data-action="eg1-ltr-start">' + icon('sound', 20) + ' 开始</button></div>';
    }
    if (ltr.done) {
      return '<div class="eg1-tip" style="font-size:18px">' + esc(ltrTip) + '</div>' +
        '<div style="text-align:center;margin-top:10px"><button class="quiz-audio" style="margin:0" data-action="eg1-ltr-start">' + icon('sound', 20) + ' 再来 10 题</button></div>';
    }
    return '<div style="text-align:center;margin:6px 0 12px">' +
      '<button class="quiz-audio" style="margin:0" data-action="eg1-ltr-say">' + icon('sound', 20) + ' 听一听</button>' +
      '<div class="eg1-tip">第 ' + (ltr.n + 1) + ' / ' + ltr.total + ' 题 · 答对 ' + ltr.right + ' 题</div></div>' +
      '<div class="opt-grid">' + ltr.opts.map(function (o, i) {
        var cls = 'opt-btn word-opt';
        if (ltr.answered) { if (o.c) cls += ' good'; else if (ltr.pick === i) cls += ' bad'; }
        return '<button class="' + cls + '" data-action="eg1-ltr-ans" data-i="' + i + '">' + esc(o.t) + '</button>';
      }).join('') + '</div>' +
      (ltrTip ? '<div class="eg1-tip">' + esc(ltrTip) + '</div>' : '');
  }
  function ltrStep(keep) {
    var Ls = A.letters || [];
    if (Ls.length < 4) return;
    var tg = Ls[Math.floor(Math.random() * Ls.length)];
    var others = [], guard = 0;
    while (others.length < 3 && guard < 240) {
      var c = Ls[Math.floor(Math.random() * Ls.length)];
      guard++;
      if (c === tg || others.indexOf(c) >= 0) continue;
      others.push(c);
    }
    ltr = {
      target: tg,
      opts: shuffleArr([tg].concat(others)).map(function (x) { return { t: x[0].toUpperCase() + x[0], c: x === tg }; }),
      n: keep ? keep.n : 0, total: keep ? keep.total : 10, right: keep ? keep.right : 0,
      answered: false, pick: -1, done: false
    };
    ltrTip = '';
    repaintLtr();
    setTimeout(function () { window.EG1_say(tg[0]); }, 420);
  }
  function onLtrAns(btn) {
    if (!ltr || ltr.answered || ltr.done) return;
    var i = parseInt(btn.getAttribute('data-i'), 10);
    var o = ltr.opts[i]; if (!o) return;
    ltr.pick = i; ltr.answered = true;
    var nm = ltr.target[0].toUpperCase() + ltr.target[0];
    if (o.c) {
      ltr.right++;
      try { addStars(1, btn); } catch (e) {}
      try { playCorrect(); praise(); } catch (e) {}
      ltrTip = '答对啦！' + nm + ' · ' + ltr.target[3] + '（' + ltr.target[4] + '）';
    } else {
      try { playWrong(); } catch (e) {}
      ltrTip = '是「' + nm + '」哦 · ' + ltr.target[3] + '（' + ltr.target[4] + '）';
    }
    repaintLtr();
    setTimeout(function () {
      if (!ltr) return;
      if (ltr.n + 1 >= ltr.total) {
        ltr.done = true;
        ltrTip = '这一轮做完啦，答对 ' + ltr.right + ' / ' + ltr.total + ' 题';
        repaintLtr();
        return;
      }
      ltrStep({ n: ltr.n + 1, total: ltr.total, right: ltr.right });
    }, 1200);
  }
  function repaintLtr() {
    var box = document.getElementById('eg1-ltr');
    if (box) box.innerHTML = ltrInnerHTML();
    else { var outer = document.getElementById('eg1-ltrbox'); if (outer) outer.innerHTML = ltrBoxHTML(); else refresh(); }
  }


  /* v4.182：套一层容器 —— 切主题词只重画这块，不再整页 refresh（原来会弹回页面顶部） */
  function wordHTML() {
    return '<div id="eg1-wordbox">' + wordInnerHTML() + '</div>';
  }
  function wordInnerHTML() {
    var th = (A.themes || [])[themeIdx] || (A.themes || [])[0];
    var col = themeColor(themeIdx);
    var h = '<div class="card" style="border-color:' + col + '44">' +
      '<div class="tc-head" style="display:flex;align-items:center;gap:8px">' + icon('book', 26, col) + '<span>主题词卡</span></div>' +
      '<div class="admin-tip" style="margin:0 0 10px">点一下会<b>先念英文、再念中文</b>。<b>不要求背</b>，听得多、跟得多，自然就记住了。</div>' +
      '<div class="eg1-fams">' + (A.themes || []).map(function (t, i) {
        var c = themeColor(i);
        var st = (themeIdx === i) ? (' style="border-color:' + c + ';color:' + c + ';background:' + c + '1a"') : '';
        return '<button type="button" class="eg1-fam' + (themeIdx === i ? ' on' : '') + '" data-action="eg1-theme" data-i="' + i + '"' + st + '>' + esc(t.n) + '</button>';
      }).join('') + '</div>' +
      '<div class="eg1-grid" style="margin-top:12px">' + (th ? th.w : []).map(function (p) {
        var pic = (A.pics && A.pics[p[0]]) ? '<span class="eg1-pic-wrap">' + A.pics[p[0]] + '</span>' : '';
        return '<button type="button" class="eg1-card" data-action="eg1-word" data-w="' + esc(p[0]) + '" data-z="' + esc(p[1]) + '" style="border-color:' + col + '">' +
          pic +
          '<span class="eg1-up" style="font-size:22px;color:' + col + '">' + esc(p[0]) + '</span>' +
          '<span class="eg1-ex">' + esc(p[1]) + '</span></button>';
      }).join('') + '</div></div>';

    /* v4.225：原来只有「听音选词」一种玩法，升级成练习场（4 种题型 × 任选主题 × 5/10 题） */
    h += '<div class="card" style="border-color:var(--pink-l)" id="eg1-drillbox">' + drillBoxHTML() + '</div>';
    /* v4.226：高频词 40 个 —— 原来 156 个词全是名词，缺了这些功能词就串不成句子 */
    h += swHTML();
    return h;
  }
  function swHTML() {
    var n = (A.sw || []).length;
    if (!n) return '';
    return '<div class="card" style="border-color:var(--yellow-l)">' +
      '<div class="tc-head" style="display:flex;align-items:center;gap:8px">' + icon('pen', 26, '#FFB93C') + '<span>高频词 · ' + n + ' 个</span></div>' +
      '<div class="admin-tip" style="margin:0 0 10px">这些词<b>自己没什么意思，但几乎每句话里都有</b>（我 / 是 / 有 / 这个…）。' +
      '原来的词全是名词，缺了它们就串不成句子。<b>不背、不默写</b>，点一下听它带的短语。</div>' +
      '<div class="eg1-words">' + (A.sw || []).map(function (p, i) {
        return '<button type="button" class="eg1-w" data-action="eg1-sw" data-i="' + i + '">' +
          esc(p[0]) + '<i>' + esc(p[1]) + '</i></button>';
      }).join('') + '</div>' +
      '<div class="eg1-tip">点一个词：先念这个词，再念它带的短语（英文 + 中文）。</div>' +
      '</div>';
  }
  function repaintDrill() {
    var box = document.getElementById('eg1-drill');
    if (box) box.innerHTML = drillInnerHTML();
    else repaintDrillBox();
  }
  /* 换题型 / 换范围 / 换题数时：连「练哪一组」那个标签一起重画（它在外层） */
  function repaintDrillBox() {
    var outer = document.getElementById('eg1-drillbox');
    if (outer) outer.innerHTML = drillBoxHTML();
    else refresh();
  }
  /* v4.182：局部重画单词区（主题词卡 + 听音选词），不整页 refresh，页面不跳顶 */
  /* ---------- v4.225 练习场：4 种题型 × 任选主题 × 5/10 题 ---------- */
  function drillPool() {
    if (qscope === 'all') return allWords();
    var th = (A.themes || [])[qscope];
    return (th && th.w && th.w.length) ? th.w.slice() : allWords();
  }
  function drillScopeName() {
    if (qscope === 'all') return '全部 ' + allWords().length + ' 词';
    var th = (A.themes || [])[qscope];
    return th ? (th.n + ' · ' + th.w.length + ' 词') : '全部';
  }
  function drillBoxHTML() {
    var col = themeColor(qscope === 'all' ? 0 : qscope);
    return '<div class="tc-head" style="display:flex;align-items:center;gap:8px">' + icon('sound', 26, '#FF7E9D') + '<span>练习场</span>' +
      '<span class="chip" style="margin-left:auto;background:' + col + '1a;color:' + col + '">' + esc(drillScopeName()) + '</span></div>' +
      '<div class="admin-tip" style="margin:0 0 10px">四种玩法任选，<b>全是选择题：不拼写、不背单词、不写句子</b>。做错的词会收进错题本，改天再练一遍。</div>' +
      '<div class="eg1-fams">' + QMODES.map(function (m) {
        return '<button type="button" class="eg1-fam' + (qmode === m[0] ? ' on' : '') + '" data-action="eg1-qmode" data-m="' + m[0] + '">' + m[1] + '</button>';
      }).join('') + '</div>' +
      '<div class="eg1-fams" style="margin-top:8px">' +
      '<button type="button" class="eg1-fam' + (qscope === 'all' ? ' on' : '') + '" data-action="eg1-qscope" data-s="all">全部</button>' +
      (A.themes || []).map(function (tp, i) {
        return '<button type="button" class="eg1-fam' + (qscope === i ? ' on' : '') + '" data-action="eg1-qscope" data-s="' + i + '">' + esc(tp.n) + '</button>';
      }).join('') + '</div>' +
      '<div class="eg1-fams" style="margin-top:8px">' + [5, 10].map(function (nn) {
        return '<button type="button" class="eg1-fam' + (qtotal === nn ? ' on' : '') + '" data-action="eg1-qtotal" data-n="' + nn + '">' + nn + ' 题</button>';
      }).join('') + '</div>' +
      '<div id="eg1-drill" style="margin-top:12px">' + drillInnerHTML() + '</div>';
  }
  /* 题干：听音是喇叭，看图是配图，中译英给中文，英译中给英文 */
  function stemHTML() {
    var tg = quiz.target;
    if (quiz.mode === 'listen') {
      return '<button class="quiz-audio" style="margin:0" data-action="eg1-quiz-say">' + icon('sound', 20) + ' 听一听</button>' +
        '<div class="eg1-tip">听英文，选出你听到的词</div>';
    }
    if (quiz.mode === 'pic') {
      var pic = (A.pics && A.pics[tg[0]]) ? '<span class="eg1-pic-wrap" style="width:104px;height:104px">' + A.pics[tg[0]] + '</span>' : '';
      return '<div style="margin:0 auto 6px">' + pic + '</div><div class="eg1-tip">这是什么？选出它的中文</div>';
    }
    if (quiz.mode === 'zh2en') {
      return '<div style="font-size:32px;font-weight:800;color:var(--ink);margin:4px 0 6px">' + esc(tg[1]) + '</div>' +
        '<div class="eg1-tip">英文是哪个？</div>';
    }
    return '<div style="font-size:32px;font-weight:800;color:var(--blue);margin:4px 0 6px">' + esc(tg[0]) + '</div>' +
      '<div class="eg1-tip">中文是什么意思？</div>';
  }
  function drillInnerHTML() {
    if (!quiz) {
      return '<div class="eg1-tip">点下面开始，一共 ' + qtotal + ' 题（' + esc(QMODES[0][1]) + '等四种玩法任选）。</div>' +
        '<div style="text-align:center;margin-top:10px"><button class="quiz-audio" style="margin:0" data-action="eg1-drill-start">' + icon('sound', 20) + ' 开始</button></div>';
    }
    if (quiz.done) {
      var wr = quiz.wrongList || [];
      var wh = '';
      if (wr.length) {
        wh = '<div class="eg1-tip">再看看这几个：' + wr.map(function (w) { return esc(w[0]) + '（' + esc(w[1]) + '）'; }).join('、') + '</div>' +
          '<div style="text-align:center;margin-top:8px"><button class="mini-btn" data-action="eg1-drill-again">只练错的这几个</button></div>';
      }
      return '<div class="eg1-tip" style="font-size:18px">' + esc(quizTip) + '</div>' + wh +
        '<div style="text-align:center;margin-top:10px"><button class="quiz-audio" style="margin:0" data-action="eg1-drill-start">' + icon('sound', 20) + ' 再来 ' + qtotal + ' 题</button></div>';
    }
    return '<div style="text-align:center;margin:6px 0 12px">' + stemHTML() +
      '<div class="eg1-tip">第 ' + (quiz.n + 1) + ' / ' + quiz.total + ' 题 · 答对 ' + quiz.right + ' 题</div></div>' +
      '<div class="opt-grid' + (quiz.opts.length === 3 ? ' cols3' : '') + '">' +
      quiz.opts.map(function (o, i) {
        var cls = 'opt-btn word-opt';
        if (quiz.answered) { if (o.c) cls += ' good'; else if (quiz.pick === i) cls += ' bad'; }
        return '<button class="' + cls + '" data-action="eg1-quiz-ans" data-i="' + i + '">' + esc(o.t) +
          (o.z ? '<i class="eg1-wzh">' + esc(o.z) + '</i>' : '') + '</button>';
      }).join('') + '</div>' +
      (quizTip ? '<div class="eg1-tip">' + esc(quizTip) + '</div>' : '');
  }
  function drillStep(keep, only) {
    var pool = (only && only.length) ? only : drillPool();
    if (!pool.length) return;
    var target = pool[Math.floor(Math.random() * pool.length)];
    var sameZh = (qmode === 'pic' || qmode === 'en2zh');   /* 这两种题选项是中文，中文不能撞 */
    var others = [], guard = 0;
    while (others.length < 3 && guard < 240) {
      var c = pool[Math.floor(Math.random() * pool.length)];
      guard++;
      if (c === target) continue;
      if (sameZh ? (c[1] === target[1]) : (c[0] === target[0])) continue;
      if (others.indexOf(c) >= 0) continue;
      others.push(c);
    }
    if (others.length < 3) {                                /* 本组词太少：从 110 词全池补 */
      var all = allWords(), g2 = 0;
      while (others.length < 3 && g2 < 300) {
        var c2 = all[Math.floor(Math.random() * all.length)];
        g2++;
        if (sameZh ? (c2[1] === target[1]) : (c2[0] === target[0])) continue;
        if (others.indexOf(c2) >= 0) continue;
        others.push(c2);
      }
    }
    var fmt = function (p) {
      if (qmode === 'pic' || qmode === 'en2zh') return { t: p[1], z: '', c: p[0] === target[0] };
      if (qmode === 'zh2en') return { t: p[0], z: '', c: p[0] === target[0] };
      return { t: p[0], z: p[1], c: p[0] === target[0] };
    };
    quiz = {
      mode: qmode, target: target, opts: shuffleArr([target].concat(others)).map(fmt),
      wrongList: keep ? (keep.wrongList || []) : [],
      tag: '英语·' + (qscope === 'all' ? '综合' : ((A.themes[qscope] || {}).n || '')),
      n: keep ? keep.n : 0,
      total: keep ? keep.total : ((only && only.length) ? only.length : qtotal),
      right: keep ? keep.right : 0,
      answered: false, pick: -1, done: false
    };
    quizTip = '';
    repaintDrill();
    if (qmode === 'listen') setTimeout(function () { window.EG1_say(target[0]); }, 420);
  }
  function drillNext() {
    if (!quiz) return;
    if (quiz.n + 1 >= quiz.total) {
      quiz.done = true;
      var w = quiz.wrongList || [];
      quizTip = '这一轮做完啦，答对 ' + quiz.right + ' / ' + quiz.total + ' 题' + (w.length ? '（错的下面再练一遍）' : '，全对！');
      repaintDrill();
      return;
    }
    drillStep({ n: quiz.n + 1, total: quiz.total, right: quiz.right, wrongList: quiz.wrongList });
  }
  /* 错题本里的题面（按题型给不同的问法） */
  function wrongQOf() {
    if (!quiz) return null;
    var q = { listen: '听一听，选出你听到的词', pic: '看图，选出它的中文', zh2en: '选出这个中文的英文', en2zh: '选出这个英文的中文' }[quiz.mode] || '选出正确的答案';
    return {
      type: 'word',
      stage: '<div class="quiz-q-row"><div class="quiz-q">' + q + '（' + esc(quiz.tag.replace('英语·', '')) + '）</div></div>',
      tag: quiz.tag,
      options: quiz.opts.map(function (o) {
        return { html: String(o.t) + (o.z ? '<br><span style="font-size:12px;color:#8A8FA3;font-weight:700">' + esc(o.z) + '</span>' : ''), correct: !!o.c };
      })
    };
  }
  function onQuizAns(btn) {
    if (!quiz || quiz.answered || quiz.done) return;
    var i = parseInt(btn.getAttribute('data-i'), 10);
    var opt = quiz.opts[i]; if (!opt) return;
    quiz.pick = i; quiz.answered = true;
    if (opt.c) {
      quiz.right++;
      try { addStars(1, btn); } catch (e) {}
      try { playCorrect(); praise(); } catch (e) {}
      quizTip = '答对啦！' + quiz.target[0] + '（' + quiz.target[1] + '）';
    } else {
      quiz.wrongList.push(quiz.target);
      try { collectWrong('english', wrongQOf()); } catch (e) {}
      try { playWrong(); } catch (e) {}
      quizTip = '是「' + quiz.target[0] + '」哦（' + quiz.target[1] + '）。错的不怕，已经收进错题本啦。';
    }
    repaintDrill();
    setTimeout(function () { drillNext(); }, 1300);
  }
  function repaintWord() {
    var box = document.getElementById('eg1-wordbox');
    if (box) box.innerHTML = wordInnerHTML();
    else refresh(); /* 兜底：万一容器不在（比如别的子页），退回整页重画 */
  }

  /* ---------- 儿歌播放：先念英文（磨耳朵），再念中文意思（家长能懂） ---------- */
  function playSong(i) {
    var s = (A.songs || [])[i]; if (!s) return;
    if (songTimer) { clearTimeout(songTimer); songTimer = null; }
    stopSay();
    songIdx = i; songLine = 0; openSong = i;
    var lines = s.l;
    var step = function () {
      if (songIdx !== i) return;
      if (songLine >= lines.length) { songIdx = -1; songLine = -1; repaintSongs(); return; }
      repaintSongs();
      var cur = lines[songLine];
      sayOne(cur[0], 0.75, function () {            /* 先念英文（磨耳朵） */
        if (songIdx !== i) return;
        if (cur[1]) {                                /* 再念中文意思（家长能懂、能教） */
          setTimeout(function () {
            sayZh(cur[1], function () {
              if (songIdx !== i) return;
              songTimer = setTimeout(function () { songLine++; step(); }, 850);
            });
          }, 350);
        } else {
          songTimer = setTimeout(function () { songLine++; step(); }, 1100);
        }
      });
    };
    step();
  }
  function stopSong() {
    if (songTimer) { clearTimeout(songTimer); songTimer = null; }
    songIdx = -1; songLine = -1; stopSay(); repaintSongs();
  }
  function repaintSongs() {
    var box = document.getElementById('eg1-songs');
    if (box) box.innerHTML = songsInnerHTML();
  }

  /* ---------- v4.226 小故事：25 篇 3~5 句极简短文，整篇听 / 点句跟读 / 读完答一题 ---------- */
  function storyHTML() {
    var n = (A.rd || []).length;
    return '<div class="card" style="border-color:var(--purple-l)">' +
      '<div class="tc-head" style="display:flex;align-items:center;gap:8px">' + icon('book', 26, '#9775FA') + '<span>小故事 · ' + n + ' 篇</span></div>' +
      '<div class="admin-tip" style="margin:0 0 10px">一篇只有 <b>3~5 句</b>，用的都是她听过的短词。' +
      '先点「整篇听」听一遍，再自己点句子跟读；最后有一道小题，<b>答错也没关系</b>。</div>' +
      '<div id="eg1-storybox">' + storyInnerHTML() + '</div></div>';
  }
  function storyInnerHTML() {
    return (A.rd || []).map(function (r, i) {
      var open = storyIdx === i;
      var pic = (A.pics && A.pics[r.p]) ? '<span class="eg1-pic-wrap" style="width:58px;height:58px;float:right;margin:0 0 6px 10px">' + A.pics[r.p] + '</span>' : '';
      var h = '<div class="eg1-song' + (open ? ' open' : '') + '">' +
        '<button type="button" class="eg1-song-head" data-action="eg1-story" data-i="' + i + '">' +
        '<span class="eg1-en">' + esc(r.t) + '<span class="eg1-zh">共 ' + r.l.length + ' 句</span></span>' +
        '<span class="eg1-act" style="margin-left:auto">' + (open ? '收起' : '展开') + '</span></button>';
      if (open) {
        h += '<div class="eg1-lines">' + pic +
          r.l.map(function (p, k) {
            var on = (storyIdx === i && storyLine === k);
            return '<button type="button" class="eg1-tap" style="' + (on ? 'background:#FFF6D6;border-color:#FFD43B' : '') + '" data-action="eg1-story-line" data-i="' + i + '" data-k="' + k + '">' +
              (on ? '🔊 ' : '') + esc(p[0]) + '<span class="eg1-lzh">' + esc(p[1]) + '</span></button>';
          }).join('') +
          '<div class="poem-actions" style="margin-top:10px;clear:both">' +
          (storyTimer
            ? '<button class="quiz-audio" style="margin:0" data-action="eg1-story-stop">' + icon('stop', 20) + ' 停一下</button>'
            : '<button class="quiz-audio" style="margin:0" data-action="eg1-story-play" data-i="' + i + '">' + icon('sound', 20) + ' 整篇听</button>') +
          '</div>' +
          '<div style="margin-top:14px;padding-top:12px;border-top:2px dashed #E7F0FA;clear:both">' +
          '<div style="font-weight:800;font-size:15px;margin-bottom:8px">读完答一题：' + esc(r.q) + '</div>' +
          '<div class="opt-grid">' + r.o.map(function (o, k) {
            var cls = 'opt-btn word-opt';
            if (storyAns[i] != null) { if (k === r.a) cls += ' good'; else if (storyAns[i] === k) cls += ' bad'; }
            return '<button class="' + cls + '" data-action="eg1-story-ans" data-i="' + i + '" data-k="' + k + '">' + esc(o) + '</button>';
          }).join('') + '</div>' +
          (storyAns[i] != null ? '<div class="eg1-tip">' + (storyAns[i] === r.a ? '答对啦！' : '没关系，再听一遍就找到啦。') + '</div>' : '') +
          '</div></div>';
      }
      return h + '</div>';
    }).join('');
  }
  function repaintStory() {
    var box = document.getElementById('eg1-storybox');
    if (box) box.innerHTML = storyInnerHTML();
    else refresh();
  }
  function playStory(i) {
    var r = (A.rd || [])[i]; if (!r) return;
    if (dlgTimer) { clearTimeout(dlgTimer); dlgTimer = null; }
    stopSay();
    storyIdx = i; storyLine = 0; storyAns[i] = null;
    var step = function () {
      if (storyIdx !== i) return;
      if (storyLine >= r.l.length) { storyLine = -1; storyTimer = null; repaintStory(); return; }
      repaintStory();
      var cur = r.l[storyLine];
      sayOne(cur[0], 0.8, function () {
        if (storyIdx !== i) return;
        setTimeout(function () {
          if (storyIdx !== i) return;
          sayZh(cur[1], function () {
            storyTimer = setTimeout(function () { storyLine++; step(); }, 800);
          });
        }, 300);
      });
    };
    step();
  }
  function stopStory() {
    if (storyTimer) { clearTimeout(storyTimer); storyTimer = null; }
    storyLine = -1; stopSay(); repaintStory();
  }

  /* ---------- 主渲染 ---------- */
  window.EG1_render = function (el) {
    ensureCss();
    var hint = '今天 10 分钟就够，<b>多听、多跟着哼，不要考他</b>。';
    var body = SUB === 'listen' ? listenHTML() :
               (SUB === 'letter' ? letterHTML() :
               (SUB === 'story' ? storyHTML() : wordHTML()));
    el.innerHTML = gradeTabsHTML('english') + subTabsHTML() +
      '<div class="hero" style="margin-bottom:14px"><div class="hi">' + icon('sparkle', 20) + '<span>一年级英语 · 听说先行</span></div>' +
      '<h2>先让他喜欢听、愿意说</h2><p>' + hint + '</p></div>' +
      body;
  };
  /* 换英语页/切年级时把朗读停掉，免得还在后台念 */
  window.EG1_leave = function () {
    if (songTimer) { clearTimeout(songTimer); songTimer = null; }
    if (dlgTimer) { clearTimeout(dlgTimer); dlgTimer = null; }
    if (storyTimer) { clearTimeout(storyTimer); storyTimer = null; }
    songIdx = -1; songLine = -1; storyLine = -1; stopSay();
  };

  /* ---------- 事件：只用一次性委托，避免重复绑定 ---------- */
  if (!window.__EG1_BOUND) {
    window.__EG1_BOUND = true;
    document.addEventListener('click', function (e) {
      var t = e.target instanceof Element ? e.target.closest('[data-action]') : null;
      if (!t) return;
      var act = t.getAttribute('data-action');
      if (String(act).indexOf('eg1-') !== 0) return;
      switch (act) {
        case 'eg1-sub': {
          SUB = t.getAttribute('data-m') || 'listen';
          if (SUB !== 'listen') stopSong();
          quiz = null; quizTip = '';
          refresh();
          break;
        }
        case 'eg1-song': {
          var i = parseInt(t.getAttribute('data-i'), 10);
          openSong = (openSong === i) ? -1 : i;
          if (songIdx === i) stopSong();
          repaintSongs();
          break;
        }
        case 'eg1-song-play': playSong(parseInt(t.getAttribute('data-i'), 10)); break;
        case 'eg1-song-stop': stopSong(); break;
        case 'eg1-letter': {
          var L = (A.letters || [])[parseInt(t.getAttribute('data-i'), 10)];
          if (!L) break;
          /* 字母名 → 例词（例词的首音就是这个字母音）；最后念中文意思 */
          speakSeq([L[0], L[3]], 300, 0.85, function () {
            if (L[4]) setTimeout(function () { sayZh(L[4]); }, 220);
          });
          break;
        }
        /* v4.181：自我介绍 —— 直接读整句，不拼、不等 */
        case 'eg1-intro': {
          var it = (A.intro || [])[parseInt(t.getAttribute('data-i'), 10)];
          if (it) sayOne(it.en, 0.85, function () { if (it.zh) setTimeout(function () { sayZh(it.zh); }, 220); });
          break;
        }
        case 'eg1-say': {
          var r = (A.routine || [])[parseInt(t.getAttribute('data-i'), 10)];
          if (r) sayOne(r.en, 0.85, function () { if (r.zh) setTimeout(function () { sayZh(r.zh); }, 220); });
          break;
        }
        /* v4.181：拼读起步也改成「直接读整词」——逐音拼要等很久，反而把语感切碎了 */
        case 'eg1-first': {
          var p = (A.first || [])[parseInt(t.getAttribute('data-i'), 10)];
          if (p) sayOne(p[3], 0.85, function () { if (p[4]) setTimeout(function () { sayZh(p[4]); }, 220); });
          break;
        }
        /* v4.182：只重画词族卡这一块，不再整页 refresh（整页重绘会跳回页面顶部） */
        case 'eg1-fam': {
          var f = t.getAttribute('data-f') || '';
          openFam = (openFam === f) ? '' : f;
          repaintCvc();
          break;
        }
        /* v4.181：单词卡去掉逐字母拼读（C-A-T…cat 一个词要等很久、没有语感），直接读整词 */
        case 'eg1-word': {
          var w = t.getAttribute('data-w');
          var z = t.getAttribute('data-z') || '';
          if (w) sayOne(w, 0.85, function () { if (z) setTimeout(function () { sayZh(z); }, 220); });
          break;
        }
        /* v4.182：切主题词只重画单词区，页面停在原地不跳顶 */
        case 'eg1-theme': {
          themeIdx = parseInt(t.getAttribute('data-i'), 10) || 0;
          quiz = null; quizTip = '';
          repaintWord();
          break;
        }
        /* v4.225：练习场（4 种题型 / 范围 / 题数）+ 字母小测 + 资料册手风琴 */
        case 'eg1-quiz-start':
        case 'eg1-drill-start': quiz = null; quizTip = ''; drillStep(null, null); break;
        case 'eg1-drill-again': {
          var wl = (quiz && quiz.wrongList) ? quiz.wrongList.slice() : [];
          if (wl.length) { quiz = null; quizTip = ''; drillStep(null, wl); }
          break;
        }
        case 'eg1-qmode': qmode = t.getAttribute('data-m') || 'listen'; quiz = null; quizTip = ''; repaintDrillBox(); break;
        case 'eg1-qscope': {
          var s = t.getAttribute('data-s');
          qscope = (s === 'all') ? 'all' : (parseInt(s, 10) || 0);
          quiz = null; quizTip = ''; repaintDrillBox();
          break;
        }
        case 'eg1-qtotal': qtotal = parseInt(t.getAttribute('data-n'), 10) || 5; quiz = null; quizTip = ''; repaintDrillBox(); break;
        case 'eg1-quiz-say': if (quiz && quiz.target) sayOne(quiz.target[0], 0.85); break;
        case 'eg1-quiz-ans': onQuizAns(t); break;
        case 'eg1-ltr-start': ltr = null; ltrTip = ''; ltrStep(null); break;
        case 'eg1-ltr-say': if (ltr && ltr.target) window.EG1_say(ltr.target[0]); break;
        case 'eg1-ltr-ans': onLtrAns(t); break;
        /* v4.226：迷你对话 / 高频词 / 小故事 */
        case 'eg1-dlg': {
          var egDi = parseInt(t.getAttribute('data-i'), 10);
          if (dlgTimer) { clearTimeout(dlgTimer); dlgTimer = null; }
          stopSay();
          openDlg = (openDlg === egDi) ? -1 : egDi;
          repaintDlg();
          break;
        }
        case 'eg1-dlg-play': playDlg(parseInt(t.getAttribute('data-i'), 10)); break;
        case 'eg1-dlg-line': {
          var egD = (A.dlg || [])[parseInt(t.getAttribute('data-i'), 10)];
          var egDk = parseInt(t.getAttribute('data-k'), 10);
          if (egD && egD.l[egDk]) {
            var egLn = egD.l[egDk];
            sayOne(egLn[1], 0.85, function () { setTimeout(function () { sayZh(egLn[2]); }, 260); });
          }
          break;
        }
        case 'eg1-sw': {
          var egSw = (A.sw || [])[parseInt(t.getAttribute('data-i'), 10)];
          if (egSw) sayOne(egSw[0], 0.85, function () {
            setTimeout(function () {
              sayOne(egSw[2], 0.82, function () { setTimeout(function () { sayZh(egSw[3]); }, 280); });
            }, 380);
          });
          break;
        }
        case 'eg1-story': {
          var egSi = parseInt(t.getAttribute('data-i'), 10);
          if (storyTimer) { clearTimeout(storyTimer); storyTimer = null; }
          stopSay();
          storyLine = -1;
          storyIdx = (storyIdx === egSi) ? -1 : egSi;
          repaintStory();
          break;
        }
        case 'eg1-story-play': playStory(parseInt(t.getAttribute('data-i'), 10)); break;
        case 'eg1-story-stop': stopStory(); break;
        case 'eg1-story-line': {
          var egR = (A.rd || [])[parseInt(t.getAttribute('data-i'), 10)];
          var egRk = parseInt(t.getAttribute('data-k'), 10);
          if (egR && egR.l[egRk]) {
            if (storyTimer) { clearTimeout(storyTimer); storyTimer = null; }
            var egL2 = egR.l[egRk];
            sayOne(egL2[0], 0.85, function () { setTimeout(function () { sayZh(egL2[1]); }, 260); });
          }
          break;
        }
        case 'eg1-story-ans': {
          var egAi = parseInt(t.getAttribute('data-i'), 10);
          var egAk = parseInt(t.getAttribute('data-k'), 10);
          storyAns[egAi] = egAk;
          repaintStory();
          break;
        }
      }
    });
  }
})();
