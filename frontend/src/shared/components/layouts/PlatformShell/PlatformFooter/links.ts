export interface FooterColumn {
  id: string
  title: string
  links: { label: string; href: string }[]
}

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    id: 'platform',
    title: 'Платформа',
    links: [
      { label: 'Курсы', href: '/courses' },
      { label: 'Маршруты', href: '/coming-soon' },
      { label: 'Песочница', href: '/coming-soon' },
      { label: 'Лидерборд', href: '/coming-soon' }
    ]
  },
  {
    id: 'resources',
    title: 'Ресурсы',
    links: [
      { label: 'Документация', href: '/coming-soon' },
      { label: 'Блог', href: '/coming-soon' },
      { label: 'Changelog', href: '/coming-soon' },
      { label: 'Статус', href: '/coming-soon' }
    ]
  },
  {
    id: 'company',
    title: 'Компания',
    links: [
      { label: 'О проекте', href: '/' },
      { label: 'Карьера', href: '/coming-soon' },
      { label: 'Контакты', href: '/#footer' }
    ]
  },
  {
    id: 'legal',
    title: 'Правовое',
    links: [
      { label: 'Privacy', href: '/coming-soon' },
      { label: 'Terms', href: '/coming-soon' },
      { label: 'Cookie', href: '/coming-soon' }
    ]
  }
]
