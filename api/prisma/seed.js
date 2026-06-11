import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

// Default channel icons (inline SVG)
const DEFAULT_ICONS = [
  {
    name: 'Telegram',
    channelType: 'telegram',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>`,
  },
  {
    name: 'Viber',
    channelType: 'viber',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11.4 0C9.473.028 5.333.344 3.38 2.106 1.837 3.6 1.24 5.88 1.16 8.7c-.08 2.82-.18 8.1 4.96 9.54h.01l-.01 2.18s-.04.88.55 1.06c.37.12.58-.07 1.63-1.22.58-.63 1.37-1.56 1.97-2.27 5.43.46 9.6-.58 10.08-.76.55-.2 3.66-.58 4.16-4.7.52-4.26.08-6.94-1.02-8.14 0 0-.02-.02-.02-.04C22.52 3.18 14.79-.04 11.4 0zm.32 1.93c2.95-.02 9.19 2.47 10.06 3.43.86.96 1.27 3.38.81 7.12-.4 3.28-2.76 3.56-3.22 3.73-.4.15-4.06 1.05-8.88.7 0 0-3.51 4.23-3.89 4.61-.06.06-.13.08-.18.07-.07-.02-.09-.1-.09-.17l.02-5c-4.28-1.16-4.03-5.63-3.96-7.94.07-2.31.5-4.2 1.76-5.44C5.65 2.64 8.77 1.97 11.72 1.93z"/></svg>`,
  },
  {
    name: 'Phone',
    channelType: 'phone',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79a15.053 15.053 0 0 0 6.59 6.59l2.2-2.2a1.003 1.003 0 0 1 1.01-.24c1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.1.31.03.66-.25 1.01l-2.2 2.21z"/></svg>`,
  },
  {
    name: 'WhatsApp',
    channelType: 'whatsapp',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>`,
  },
  {
    name: 'Email',
    channelType: 'email',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>`,
  },
  {
    name: 'Instagram',
    channelType: 'instagram',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>`,
  },
  {
    name: 'Facebook',
    channelType: 'facebook',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
  },
  {
    name: 'TikTok',
    channelType: 'tiktok',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>`,
  },
  {
    name: 'Callback',
    channelType: 'callback',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57-.35-.12-.74-.03-1.02.24l-2.2 2.2a15.045 15.045 0 0 1-6.59-6.59l2.2-2.21c.28-.26.36-.65.25-1C8.7 6.45 8.5 5.25 8.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1zM12 3v10l3-3h6V3h-9z"/></svg>`,
  },
];

export async function seedDefaultIcons(prisma) {
  console.log('🌱 Seeding default channel icons...');

  for (const icon of DEFAULT_ICONS) {
    try {
      const existing = await prisma.mediaFile.findFirst({
        where: { channelType: icon.channelType, isDefault: true },
      });

      if (!existing) {
        const slug = `default-${icon.channelType}`;
        const svgBuffer = Buffer.from(icon.svg);
        const hash = createHash('sha256').update(svgBuffer).digest('hex');

        await prisma.mediaFile.create({
          data: {
            name: `Default ${icon.name} Icon`,
            slug,
            type: 'SVG',
            mimeType: 'image/svg+xml',
            subtype: 'icon',
            originalUrl: `/media/${slug}.svg`,
            url: `/media/${slug}.svg`,
            channelType: icon.channelType,
            isDefault: true,
            svgContent: icon.svg,
            size: svgBuffer.length,
            hash,
            width: 24,
            height: 24,
          },
        });
        console.log(`✅ Created icon: ${icon.name}`);
      } else {
        console.log(`⏭️  Icon already exists: ${icon.name}`);
      }
    } catch (e) {
      console.error(`❌ Error seeding icon ${icon.name}:`, e.message);
    }
  }

  console.log('✅ Icons seeding completed');
}

const DEFAULT_TEMPLATES = [
  {
    type: 'FLOATING_MENU',
    name: 'Плаваюче меню зв\'язку',
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

async function waitForDb(prisma, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (e) {
      console.log(`⏳ Waiting for DB... attempt ${i + 1}/${maxAttempts}`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  throw new Error('Database not available after retries');
}

export async function seedTemplates(prisma) {
  console.log('🌱 Seeding global templates...');

  // Wait for DB to be ready
  await waitForDb(prisma);

  for (const template of DEFAULT_TEMPLATES) {
    try {
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
    } catch (e) {
      console.error(`❌ Error seeding template ${template.name}:`, e.message);
    }
  }

  console.log('✅ Templates seeding completed');
}

export async function seed(prisma) {
  await seedTemplates(prisma);
  await seedDefaultIcons(prisma);
}

async function main() {
  const prisma = new PrismaClient();
  await seed(prisma);
  await prisma.$disconnect();
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  });
}
