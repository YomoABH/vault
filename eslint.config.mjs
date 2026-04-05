// eslint.config.js
import antfu from '@antfu/eslint-config'

export default antfu({
	ignores: [
		'**/fixtures',
	],
	gitignore: true,
	stylistic: {
		indent: 'tab',
		quotes: 'single',
	},
	typescript: true,
	vue: true,
	jsonc: false,
	yaml: false,
})
