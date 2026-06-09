import { PrismaClient } from '@prisma/client';

const DEFAULT_TEMPLATES = [
  {
    type: 'FLOATING_MENU',
    name: 'Плаваюче мену зв\'язку',
    description: 'Класичне плаваюче меню з кнопками зв\'язку',
    config: {
      color: '#1f93ff',
      iconType: 'preset',
      iconClass: 'chat',
      menuAnimation: 'fade',
      attentionAnimation: 'pulse',
      greeting: 'Потрібна допомога?',
      channels: [
        { type: 'phone', value: '+380...', label: 'Подзвонити', iconClass: 'fa-solid fa-phone' },
        { type: 'telegram', value: 'https://t.me/...', label: 'Telegram', iconClass: 'fa-brands fa-telegram' },
      ],
    },
    position: { side: 'right', bottom: 20 },
    triggers: {},
    isGlobal: true,
  },
  {
    type: 'POPUP_CALLBACK',
    name: 'Форма зворотного дзвінка',
    description: 'Popup з формою для замовлення дзвінка',
    config: {
      color: '#10b981',
      title: 'Замовити дзвінок',
      text: 'Залиште номер телефону — ми передзвонимо',
      buttonText: 'Чекаю дзвінка',
      animation: 'zoom',
      fields: ['name', 'phone', 'comment'],
    },
    position: {},
    triggers: { delay: 30, frequency: 'once' },
    isGlobal: true,
  },
  {
    type: 'POPUP_BANNER',
    name: 'Промо-баннер',
    description: 'Баннер з зображенням та CTA-кнопкою',
    config: {
      color: '#f59e0b',
      image: '',
      imageAlt: '',
      title: 'Спеціальна пропозиція!',
      text: 'Опис акції або пропозиції',
      buttonText: 'Дізнатися більше',
      buttonUrl: '#',
      buttonTarget: '_blank',
      animation: 'slide-up',
    },
    position: {},
    triggers: { delay: 10, scrollPercent: 50, frequency: 'once' },
    isGlobal: true,
  },
  {
    type: 'STICKY_BAR',
    name: 'Приклеєна панель',
    description: 'Панель зверху або знизу екрану',
    config: {
      color: '#1f2937',
      textColor: '#ffffff',
      text: '🎉 Акція! Знижка 10% на перше замовлення',
      buttonText: 'Отримати знижку',
      buttonUrl: '#discount',
      buttonTarget: '_self',
      position: 'top',
      animation: 'slide-down',
      closable: true,
    },
    position: { position: 'top' },
    triggers: {},
    isGlobal: true,
  },
  {
    type: 'SIDE_TAB',
    name: 'Бокова вкладка',
    description: 'Кнопка-вкладка з боку екрану',
    config: {
      color: '#8b5cf6',
      iconType: 'preset',
      iconClass: 'chat',
      text: 'Ми онлайн',
      animation: 'slide-left',
      attentionAnimation: 'pulse',
      side: 'right',
    },
    position: { side: 'right', top: 50 },
    triggers: {},
    isGlobal: true,
  },
];

export async function seedTemplates(prisma) {
  console.log('🌱 Seeding global templates...');

  for (const template of DEFAULT_TEMPLATES) {
    const existing = await prisma.template.findFirst({
      where: {
        type: template.type,
        isGlobal: true,
      },
    });

    if (!existing) {
      await prisma.template.create({
        data: template,
      });
      console.log(`✅ Created template: ${template.name}`);
    } else {
      console.log(`⏭️  Template already exists: ${template.name}`);
    }
  }

  console.log('✅ Templates seeding completed');
}

async function main() {
  const prisma = new PrismaClient();
  await seedTemplates(prisma);
  await prisma.$disconnect();
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  });
}
