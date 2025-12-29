export const messages = [
  {
    id: '1',
    content: `
Here is an inline contact form:

\`\`\`json
{
  "type": "form",
  "variant": "fields",
      "display": "inline",
  "title": "Contact Us",
  "data": {
    "fields": [
      { "name": "name", "type": "text", "label": "Name", "required": true },
      { "name": "email", "type": "email", "label": "Email" }
    ]
  }
}
\`\`\`
`
  },
  {
    id: '2',
    content: `
Here is a Vue component:

\`\`\`vue
<template>
  <h1>Hello Artifactuse</h1>
</template>
\`\`\`
`
  },
]
