import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Storyfeed",
  description: "An activity feed framework for Laravel.",
  base: '/docs/',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: 'logo.svg',

    nav: [
      { text: 'Home', link: '/' },
      { text: 'Examples', link: '/markdown-examples' }
    ],

    sidebar: [
      {
        text: 'About',
        items: [
          { text: 'Introduction', link: '/about/' },
          { text: 'Fundamentals', link: '/about/fundamentals' },
        ]
      },
      {
        text: 'Getting Started',
        items: [
          { text: 'Installation', link: '/getting-started/installation' },
          { text: 'Basic Usage', link: '/getting-started/basic-usage' },
        ]
      },
      {
        text: 'Guide',
        items: [
          { text: 'Recording Activities', link: '/guide/recording' },
          { text: 'Retrieving Activities', link: '/guide/retrieving' },
          { text: 'Curating the Feed', link: '/guide/curating' },
          {
            text: 'Publishing Stories',
            items: [
              { text: 'From Events', link: '/publishing/events' },
              { text: 'From Notifications', link: '/publishing/notifications' },
              { text: 'Story Discovery', link: '/publishing/discovery' },
            ]
          },
          {
            text: 'Grammar',
            items: [
              { text: 'Customizing activity headlines', link: '/' },
            ]
          },
        ]
      },
      {
        text: 'Advanced',
        items: [
          { text: 'Grouping Similar Stories', link: '/advanced/grouping' },
          { text: 'Anonymous Actors', link: '/advanced/anonymous-actors' },
          { text: 'Pruning Activities', link: '/advanced/pruning' },
        ]
      },
      {
        text: 'Architecture',
        items: [
          {
            text: 'Models',
            items: [
              { text: 'FeedActivity', link: '/architecture/models/feed-activity' },
              { text: 'FeedGroup', link: '/architecture/models/feed-activity' },
              { text: 'FeedEntity', link: '/architecture/models/feed-activity' },
            ]
          },
        ]
      },
      // {
      //   text: 'Examples',
      //   items: [
      //     { text: 'Basic Usage', link: '/examples/basic' },
      //     { text: 'Markdown Examples', link: '/markdown-examples' },
      //     { text: 'Runtime API Examples', link: '/api-examples' }
      //   ]
      // },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/storyfeed/storyfeed' }
    ]
  }
})
