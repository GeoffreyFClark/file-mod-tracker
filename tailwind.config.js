const flowbite = require("flowbite-react/tailwind");
module.exports = {
  content: [
    './src/**/*.{html,js,ts,jsx,tsx}',
    './index.html',
    flowbite.content(),
  ],
  theme: {
    extend: {},
  },
  plugins: [
    flowbite.plugin(),
]
}
