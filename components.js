Vue.component("csrf-token", {
	created: function () {
		this.refreshToken()
	},
	mounted: function () {
		let that = this
		this.$refs.token.form.addEventListener("submit", function () {
			that.refreshToken()
		})

		// 自动刷新
		setInterval(function () {
			that.refreshToken()
		}, 10 * 60 * 1000)
	},
	data: function () {
		return {
			token: ""
		}
	},
	methods: {
		refreshToken: function () {
			let that = this
			Tea.action("/csrf/token")
				.get()
				.success(function (resp) {
					that.token = resp.data.token
				})
		}
	},
	template: `<input type="hidden" name="csrfToken" :value="token" ref="token"/>`
})


Vue.component("size-capacity-view", {
	props:["v-default-text", "v-value"],
	methods: {
		composeCapacity: function (capacity) {
			return teaweb.convertSizeCapacityToString(capacity)
		}
	},
	template: `<div>
	<span v-if="vValue != null && vValue.count > 0">{{composeCapacity(vValue)}}</span>
	<span v-else>{{vDefaultText}}</span>
</div>`
})

Vue.component("page-box", {
	data: function () {
		return {
			page: ""
		}
	},
	created: function () {
		let that = this;
		setTimeout(function () {
			that.page = Tea.Vue.page;
		})
	},
	template: `<div>
	<div class="page" v-html="page"></div>
</div>`
})

/**
 * 菜单项
 */
Vue.component("inner-menu-item", {
	props: ["href", "active", "code"],
	data: function () {
		var active = this.active;
		if (typeof(active) =="undefined") {
			var itemCode = "";
			if (typeof (window.TEA.ACTION.data.firstMenuItem) != "undefined") {
				itemCode = window.TEA.ACTION.data.firstMenuItem;
			}
			active = (itemCode == this.code);
		}
		return {
			vHref: (this.href == null) ? "" : this.href,
			vActive: active
		};
	},
	template: '\
		<a :href="vHref" class="item right" style="color:#4183c4" :class="{active:vActive}">[<slot></slot>]</a> \
		'
});

Vue.component("copy-to-clipboard", {
	props: ["v-target"],
	created: function () {
		if (typeof ClipboardJS == "undefined") {
			let jsFile = document.createElement("script")
			jsFile.setAttribute("src", "/js/clipboard.min.js")
			document.head.appendChild(jsFile)
		}
	},
	methods: {
		copy: function () {
			new ClipboardJS('[data-clipboard-target]');
			teaweb.success("已复制到剪切板")
		}
	},
	template: `<a href="" title="拷贝到剪切板" :data-clipboard-target="'#' + vTarget" @click.prevent="copy"><i class="ui icon copy small"></i></em></a>`
})

Vue.component("datepicker", {
	props: ["value", "v-name", "name", "v-value", "v-bottom-left", "placeholder"],
	mounted: function () {
		let that = this
		teaweb.datepicker(this.$refs.dayInput, function (v) {
			that.day = v
			that.change()
		}, !!this.vBottomLeft)
	},
	data: function () {
		let name = this.vName
		if (name == null) {
			name = this.name
		}
		if (name == null) {
			name = "day"
		}

		let day = this.vValue
		if (day == null) {
			day = this.value
			if (day == null) {
				day = ""
			}
		}

		let placeholder = "YYYY-MM-DD"
		if (this.placeholder != null) {
			placeholder = this.placeholder
		}

		return {
			realName: name,
			realPlaceholder: placeholder,
			day: day
		}
	},
	watch: {
		value: function (v) {
			this.day = v

			let picker = this.$refs.dayInput.picker
			if (picker != null) {
				if (v != null && /^\d+-\d+-\d+$/.test(v)) {
					picker.setDate(v)
				}
			}
		}
	},
	methods: {
		change: function () {
			this.$emit("input", this.day) // support v-model，事件触发需要在 change 之前
			this.$emit("change", this.day)
		}
	},
	template: `<div style="display: inline-block">
	<input type="text" :name="realName" v-model="day" :placeholder="realPlaceholder" style="width:8.6em" maxlength="10" @input="change" ref="dayInput" autocomplete="off"/>
</div>`
})

Vue.component("server-group-selector", {
	props: ["v-groups"],
	data: function () {
		let groups = this.vGroups
		if (groups == null) {
			groups = []
		}
		return {
			groups: groups
		}
	},
	methods: {
		selectGroup: function () {
			let that = this
			let groupIds = this.groups.map(function (v) {
				return v.id.toString()
			}).join(",")
			teaweb.popup("/servers/groups/selectPopup?selectedGroupIds=" + groupIds, {
				callback: function (resp) {
					that.groups.push(resp.data.group)
				}
			})
		},
		addGroup: function () {
			let that = this
			teaweb.popup("/servers/groups/createPopup", {
				callback: function (resp) {
					that.groups.push(resp.data.group)
				}
			})
		},
		removeGroup: function (index) {
			this.groups.$remove(index)
		},
		groupIds: function () {
			return this.groups.map(function (v) {
				return v.id
			})
		}
	},
	template: `<div>
	<div v-if="groups.length > 0">
		<div class="ui label small basic" v-if="groups.length > 0" v-for="(group, index) in groups">
			<input type="hidden" name="groupIds" :value="group.id"/>
			{{group.name}} &nbsp;<a href="" title="删除" @click.prevent="removeGroup(index)"><i class="icon remove"></i></a>
		</div>
		<div class="ui divider"></div>
	</div>
	<div>
		<a href="" @click.prevent="selectGroup()">[选择分组]</a> &nbsp; <a href="" @click.prevent="addGroup()">[添加分组]</a>
	</div>
</div>`
})

Vue.component("columns-grid", {
	props: [],
	mounted: function () {
		this.columns = this.calculateColumns()

		let that = this
		window.addEventListener("resize", function () {
			that.columns = that.calculateColumns()
		})
	},
	data: function () {
		return {
			columns: "four"
		}
	},
	methods: {
		calculateColumns: function () {
			let w = window.innerWidth
			let columns = Math.floor(w / 250)
			if (columns == 0) {
				columns = 1
			}

			let columnElements = this.$el.getElementsByClassName("column")
			if (columnElements.length == 0) {
				return
			}
			let maxColumns = columnElements.length
			if (columns > maxColumns) {
				columns = maxColumns
			}

			// 添加右侧边框
			for (let index = 0; index < columnElements.length; index++) {
				let el = columnElements[index]
				el.className = el.className.replace("with-border", "")
				if (index % columns == columns - 1 || index == columnElements.length - 1 /** 最后一个 **/) {
					el.className += " with-border"
				}
			}

			switch (columns) {
				case 1:
					return "one"
				case 2:
					return "two"
				case 3:
					return "three"
				case 4:
					return "four"
				case 5:
					return "five"
				case 6:
					return "six"
				case 7:
					return "seven"
				case 8:
					return "eight"
				case 9:
					return "nine"
				case 10:
					return "ten"
				default:
					return "ten"
			}
		}
	},
	template: `<div :class="'ui ' + columns + ' columns grid counter-chart'">
	<slot></slot>
</div>`
})

Vue.component("labeled-input", {
	props: ["name", "size", "maxlength", "label", "value"],
	template: '<div class="ui input right labeled"> \
	<input type="text" :name="name" :size="size" :maxlength="maxlength" :value="value"/>\
	<span class="ui label">{{label}}</span>\
</div>'
});

// 使用Icon的链接方式
Vue.component("link-icon", {
	props: ["href", "title"],
	data: function () {
		return {
			vTitle: (this.title == null) ? "打开链接" : this.title
		}
	},
	template: `<span><slot></slot>&nbsp;<a :href="href" :title="vTitle" class="link grey"><i class="icon linkify small"></i></a></span>`
})

// 带有下划虚线的连接
Vue.component("link-red", {
	props: ["href", "title"],
	data: function () {
		let href = this.href
		if (href == null) {
			href = ""
		}
		return {
			vHref: href
		}
	},
	methods: {
		clickPrevent: function () {
			emitClick(this, arguments)
		}
	},
	template: `<a :href="vHref" :title="title" style="border-bottom: 1px #db2828 dashed" @click.prevent="clickPrevent"><span class="red"><slot></slot></span></a>`
})

// 会弹出窗口的链接
Vue.component("link-popup", {
	props: ["title"],
	methods: {
		clickPrevent: function () {
			emitClick(this, arguments)
		}
	},
	template: `<a href="" :title="title" @click.prevent="clickPrevent"><slot></slot></a>`
})

Vue.component("popup-icon", {
	props: ["title", "href", "height"],
	methods: {
		clickPrevent: function () {
			teaweb.popup(this.href, {
				height: this.height
			})
		}
	},
	template: `<span><slot></slot>&nbsp;<a href="" :title="title" @click.prevent="clickPrevent"><i class="icon clone outline small"></i></a></span>`
})

// 小提示
Vue.component("tip-icon", {
	props: ["content"],
	methods: {
		showTip: function () {
			teaweb.popupTip(this.content)
		}
	},
	template: `<a href="" title="查看帮助" @click.prevent="showTip"><i class="icon question circle"></i></a>`
})

// 提交点击事件
function emitClick(obj, arguments) {
	let event = "click"
	let newArgs = [event]
	for (let i = 0; i < arguments.length; i++) {
		newArgs.push(arguments[i])
	}
	obj.$emit.apply(obj, newArgs)
}

Vue.component("bytes-var", {
	props: ["v-bytes"],
	data: function () {
		let bytes = this.vBytes
		if (typeof bytes != "number") {
			bytes = 0
		}
		let format = teaweb.splitFormat(teaweb.formatBytes(bytes))
		return {
			format: format
		}
	},
	template:`<var class="normal">
	<span>{{format[0]}}</span>{{format[1]}}
</var>`
})

let checkboxId = 0
Vue.component("checkbox", {
	props: ["name", "value", "v-value", "id", "checked"],
	data: function () {
		checkboxId++
		let elementId = this.id
		if (elementId == null) {
			elementId = "checkbox" + checkboxId
		}

		let elementValue = this.vValue
		if (elementValue == null) {
			elementValue = "1"
		}

		let checkedValue = this.value
		if (checkedValue == null && this.checked == "checked") {
			checkedValue = elementValue
		}

		return {
			elementId: elementId,
			elementValue: elementValue,
			newValue: checkedValue
		}
	},
	methods: {
		change: function () {
			this.$emit("input", this.newValue)
		},
		check: function () {
			this.newValue = this.elementValue
		},
		uncheck: function () {
			this.newValue = ""
		},
		isChecked: function () {
			return (typeof (this.newValue) == "boolean" && this.newValue) || this.newValue == this.elementValue
		}
	},
	watch: {
		value: function (v) {
			if (typeof v == "boolean") {
				this.newValue = v
			}
		}
	},
	template: `<div class="ui checkbox">
	<input type="checkbox" :name="name" :value="elementValue" :id="elementId" @change="change" v-model="newValue"/>
	<label :for="elementId"><slot></slot></label>
</div>`
})

Vue.component("file-textarea", {
	props: ["value"],
	data: function () {
		let value = this.value
		if (typeof value != "string") {
			value = ""
		}
		return {
			realValue: value
		}
	},
	mounted: function () {
	},
	methods: {
		dragover: function () {},
		drop: function (e) {
			let that = this
			e.dataTransfer.items[0].getAsFile().text().then(function (data) {
				that.setValue(data)
			})
		},
		setValue: function (value) {
			this.realValue = value
		},
		focus: function () {
			this.$refs.textarea.focus()
		}
	},
	template: `<textarea @drop.prevent="drop" @dragover.prevent="dragover" ref="textarea" v-model="realValue"></textarea>`
})

Vue.component("keyword", {
	props: ["v-word"],
	data: function () {
		let word = this.vWord
		if (word == null) {
			word = ""
		} else {
			word = word.replace(/\)/g, "\\)")
			word = word.replace(/\(/g, "\\(")
			word = word.replace(/\+/g, "\\+")
			word = word.replace(/\^/g, "\\^")
			word = word.replace(/\$/g, "\\$")
			word = word.replace(/\?/g, "\\?")
			word = word.replace(/\*/g, "\\*")
			word = word.replace(/\[/g, "\\[")
			word = word.replace(/{/g, "\\{")
			word = word.replace(/\./g, "\\.")
		}

		let slot = this.$slots["default"][0]
		let text = slot.text
		if (word.length > 0) {
			let that = this
			let m = []  // replacement => tmp
			let tmpIndex = 0
			text = text.replaceAll(new RegExp("(" + word + ")", "ig"), function (replacement) {
				tmpIndex++
				let s = "<span style=\"border: 1px #ccc dashed; color: #ef4d58\">" + that.encodeHTML(replacement) + "</span>"
				let tmpKey = "$TMP__KEY__" + tmpIndex.toString() + "$"
				m.push([tmpKey, s])
				return tmpKey
			})
			text = this.encodeHTML(text)

			m.forEach(function (r) {
				text = text.replace(r[0], r[1])
			})

		} else {
			text = this.encodeHTML(text)
		}

		return {
			word: word,
			text: text
		}
	},
	methods: {
		encodeHTML: function (s) {
			s = s.replace(/&/g, "&amp;")
			s = s.replace(/</g, "&lt;")
			s = s.replace(/>/g, "&gt;")
			s = s.replace(/"/g, "&quot;")
			return s
		}
	},
	template: `<span><span style="display: none"><slot></slot></span><span v-html="text"></span></span>`
})

Vue.component("bits-var", {
	props: ["v-bits"],
	data: function () {
		let bits = this.vBits
		if (typeof bits != "number") {
			bits = 0
		}
		let format = teaweb.splitFormat(teaweb.formatBits(bits))
		return {
			format: format
		}
	},
	template:`<var class="normal">
	<span>{{format[0]}}</span>{{format[1]}}
</var>`
})

Vue.component("bandwidth-size-capacity-box", {
	props: ["v-name", "v-value", "v-count", "v-unit", "size", "maxlength", "v-supported-units"],
	data: function () {
		let v = this.vValue
		if (v == null) {
			v = {
				count: this.vCount,
				unit: this.vUnit
			}
		}
		if (v.unit == null || v.unit.length == 0) {
			v.unit = "mb"
		}

		if (typeof (v["count"]) != "number") {
			v["count"] = -1
		}

		let vSize = this.size
		if (vSize == null) {
			vSize = 6
		}

		let vMaxlength = this.maxlength
		if (vMaxlength == null) {
			vMaxlength = 10
		}

		let supportedUnits = this.vSupportedUnits
		if (supportedUnits == null) {
			supportedUnits = []
		}

		return {
			capacity: v,
			countString: (v.count >= 0) ? v.count.toString() : "",
			vSize: vSize,
			vMaxlength: vMaxlength,
			supportedUnits: supportedUnits
		}
	},
	watch: {
		"countString": function (newValue) {
			let value = newValue.trim()
			if (value.length == 0) {
				this.capacity.count = -1
				this.change()
				return
			}
			let count = parseInt(value)
			if (!isNaN(count)) {
				this.capacity.count = count
			}
			this.change()
		}
	},
	methods: {
		change: function () {
			this.$emit("change", this.capacity)
		}
	},
	template: `<div class="ui fields inline">
	<input type="hidden" :name="vName" :value="JSON.stringify(capacity)"/>
	<div class="ui field">
		<input type="text" v-model="countString" :maxlength="vMaxlength" :size="vSize"/>
	</div>
	<div class="ui field">
		<select class="ui dropdown" v-model="capacity.unit" @change="change">
			<option value="b" v-if="supportedUnits.length == 0 || supportedUnits.$contains('b')">Bps</option>
			<option value="kb" v-if="supportedUnits.length == 0 || supportedUnits.$contains('kb')">Kbps</option>
			<option value="mb" v-if="supportedUnits.length == 0 || supportedUnits.$contains('mb')">Mbps</option>
			<option value="gb" v-if="supportedUnits.length == 0 || supportedUnits.$contains('gb')">Gbps</option>
			<option value="tb" v-if="supportedUnits.length == 0 || supportedUnits.$contains('tb')">Tbps</option>
			<option value="pb" v-if="supportedUnits.length == 0 || supportedUnits.$contains('pb')">Pbps</option>
			<option value="eb" v-if="supportedUnits.length == 0 || supportedUnits.$contains('eb')">Ebps</option>
		</select>
	</div>
</div>`
})

Vue.component("url-patterns-box", {
	props: ["value"],
	data: function () {
		let patterns = []
		if (this.value != null) {
			patterns = this.value
		}

		return {
			patterns: patterns,
			isAdding: false,

			addingPattern: {"type": "wildcard", "pattern": ""},
			editingIndex: -1,

			patternIsInvalid: false,

			windowIsSmall: window.innerWidth < 600
		}
	},
	methods: {
		add: function () {
			this.isAdding = true
			let that = this
			setTimeout(function () {
				that.$refs.patternInput.focus()
			})
		},
		edit: function (index) {
			this.isAdding = true
			this.editingIndex = index
			this.addingPattern = {
				type: this.patterns[index].type,
				pattern: this.patterns[index].pattern
			}
		},
		confirm: function () {
			if (this.requireURL(this.addingPattern.type)) {
				let pattern = this.addingPattern.pattern.trim()
				if (pattern.length == 0) {
					let that = this
					teaweb.warn("请输入URL", function () {
						that.$refs.patternInput.focus()
					})
					return
				}
			}
			if (this.editingIndex < 0) {
				this.patterns.push({
					type: this.addingPattern.type,
					pattern: this.addingPattern.pattern
				})
			} else {
				this.patterns[this.editingIndex].type = this.addingPattern.type
				this.patterns[this.editingIndex].pattern = this.addingPattern.pattern
			}
			this.notifyChange()
			this.cancel()
		},
		remove: function (index) {
			this.patterns.$remove(index)
			this.cancel()
			this.notifyChange()
		},
		cancel: function () {
			this.isAdding = false
			this.addingPattern = {"type": "wildcard", "pattern": ""}
			this.editingIndex = -1
		},
		patternTypeName: function (patternType) {
			switch (patternType) {
				case "wildcard":
					return "通配符"
				case "regexp":
					return "正则"
				case "images":
					return "常见图片文件"
				case "audios":
					return "常见音频文件"
				case "videos":
					return "常见视频文件"
			}
			return ""
		},
		notifyChange: function () {
			this.$emit("input", this.patterns)
		},
		changePattern: function () {
			this.patternIsInvalid = false
			let pattern = this.addingPattern.pattern
			switch (this.addingPattern.type) {
				case "wildcard":
					if (pattern.indexOf("?") >= 0) {
						this.patternIsInvalid = true
					}
					break
				case "regexp":
					if (pattern.indexOf("?") >= 0) {
						let pieces = pattern.split("?")
						for (let i = 0; i < pieces.length - 1; i++) {
							if (pieces[i].length == 0 || pieces[i][pieces[i].length - 1] != "\\") {
								this.patternIsInvalid = true
							}
						}
					}
					break
			}
		},
		requireURL: function (patternType) {
			return patternType == "wildcard" || patternType == "regexp"
		}
	},
	template: `<div>
	<div v-show="patterns.length > 0">
		<div v-for="(pattern, index) in patterns" class="ui label basic small" :class="{blue: index == editingIndex, disabled: isAdding && index != editingIndex}" style="margin-bottom: 0.8em">
			<span class="grey" style="font-weight: normal">[{{patternTypeName(pattern.type)}}]</span> <span >{{pattern.pattern}}</span> &nbsp; 
			<a href="" title="修改" @click.prevent="edit(index)"><i class="icon pencil tiny"></i></a> 
			<a href="" title="删除" @click.prevent="remove(index)"><i class="icon remove small"></i></a>
		</div>
	</div>
	<div v-show="isAdding" style="margin-top: 0.5em">
		<div :class="{'ui fields inline': !windowIsSmall}">
			<div class="ui field">
				<select class="ui dropdown auto-width" v-model="addingPattern.type">
					<option value="wildcard">通配符</option>
					<option value="regexp">正则表达式</option>
					<option value="images">常见图片</option>
					<option value="audios">常见音频</option>
					<option value="videos">常见视频</option>
				</select>
			</div>
			<div class="ui field" v-show="addingPattern.type == 'wildcard' || addingPattern.type ==  'regexp'">
				<input type="text" :placeholder="(addingPattern.type == 'wildcard') ? '可以使用星号（*）通配符，不区分大小写' : '可以使用正则表达式，不区分大小写'" v-model="addingPattern.pattern" @input="changePattern" size="36" ref="patternInput" @keyup.enter="confirm()" @keypress.enter.prevent="1" spellcheck="false"/>
				<p class="comment" v-if="patternIsInvalid"><span class="red" style="font-weight: normal"><span v-if="addingPattern.type == 'wildcard'">通配符</span><span v-if="addingPattern.type == 'regexp'">正则表达式</span>中不能包含问号（?）及问号以后的内容。</span></p>
			</div>
			<div class="ui field" style="padding-left: 0"  v-show="addingPattern.type == 'wildcard' || addingPattern.type ==  'regexp'">
				<tip-icon content="通配符示例：<br/>单个路径开头：/hello/world/*<br/>单个路径结尾：*/hello/world<br/>包含某个路径：*/article/*<br/>某个域名下的所有URL：*example.com/*<br/>忽略某个扩展名：*.js" v-if="addingPattern.type == 'wildcard'"></tip-icon>
				<tip-icon content="正则表达式示例：<br/>单个路径开头：^/hello/world<br/>单个路径结尾：/hello/world$<br/>包含某个路径：/article/<br/>匹配某个数字路径：/article/(\\d+)<br/>某个域名下的所有URL：^(http|https)://example.com/" v-if="addingPattern.type == 'regexp'"></tip-icon>
			</div>
			<div class="ui field">
				<button class="ui button tiny" :class="{disabled:this.patternIsInvalid}" type="button" @click.prevent="confirm">确定</button><a href="" title="取消" @click.prevent="cancel"><i class="icon remove small"></i></a>
			</div>
		</div>
	</div>
	<div v-if=!isAdding style="margin-top: 0.5em">
		<button class="ui button tiny basic" type="button" @click.prevent="add">+</button>
	</div>
</div>`
})

/**
 * 一级菜单
 */
Vue.component("first-menu", {
	props: [],
	template: ' \
		<div class="first-menu"> \
			<div class="ui menu text blue small">\
				<slot></slot>\
			</div> \
			<div class="ui divider"></div> \
		</div>'
});

Vue.component("datetime-input", {
	props: ["v-name", "v-timestamp"],
	mounted: function () {
		let that = this
		teaweb.datepicker(this.$refs.dayInput, function (v) {
			that.day = v
			that.hour = "23"
			that.minute = "59"
			that.second = "59"
			that.change()
		})
	},
	data: function () {
		let timestamp = this.vTimestamp
		if (timestamp != null) {
			timestamp = parseInt(timestamp)
			if (isNaN(timestamp)) {
				timestamp = 0
			}
		} else {
			timestamp = 0
		}

		let day = ""
		let hour = ""
		let minute = ""
		let second = ""

		if (timestamp > 0) {
			let date = new Date()
			date.setTime(timestamp * 1000)

			let year = date.getFullYear().toString()
			let month = this.leadingZero((date.getMonth() + 1).toString(), 2)
			day = year + "-" + month + "-" + this.leadingZero(date.getDate().toString(), 2)

			hour = this.leadingZero(date.getHours().toString(), 2)
			minute = this.leadingZero(date.getMinutes().toString(), 2)
			second = this.leadingZero(date.getSeconds().toString(), 2)
		}

		return {
			timestamp: timestamp,
			day: day,
			hour: hour,
			minute: minute,
			second: second,

			hasDayError: false,
			hasHourError: false,
			hasMinuteError: false,
			hasSecondError: false
		}
	},
	methods: {
		change: function () {
			// day
			if (!/^\d{4}-\d{1,2}-\d{1,2}$/.test(this.day)) {
				this.hasDayError = true
				return
			}
			let pieces = this.day.split("-")
			let year = parseInt(pieces[0])

			let month = parseInt(pieces[1])
			if (month < 1 || month > 12) {
				this.hasDayError = true
				return
			}

			let day = parseInt(pieces[2])
			if (day < 1 || day > 32) {
				this.hasDayError = true
				return
			}

			this.hasDayError = false

			// hour
			if (!/^\d+$/.test(this.hour)) {
				this.hasHourError = true
				return
			}
			let hour = parseInt(this.hour)
			if (isNaN(hour)) {
				this.hasHourError = true
				return
			}
			if (hour < 0 || hour >= 24) {
				this.hasHourError = true
				return
			}
			this.hasHourError = false

			// minute
			if (!/^\d+$/.test(this.minute)) {
				this.hasMinuteError = true
				return
			}
			let minute = parseInt(this.minute)
			if (isNaN(minute)) {
				this.hasMinuteError = true
				return
			}
			if (minute < 0 || minute >= 60) {
				this.hasMinuteError = true
				return
			}
			this.hasMinuteError = false

			// second
			if (!/^\d+$/.test(this.second)) {
				this.hasSecondError = true
				return
			}
			let second = parseInt(this.second)
			if (isNaN(second)) {
				this.hasSecondError = true
				return
			}
			if (second < 0 || second >= 60) {
				this.hasSecondError = true
				return
			}
			this.hasSecondError = false

			let date = new Date(year, month - 1, day, hour, minute, second)
			this.timestamp = Math.floor(date.getTime() / 1000)
		},
		leadingZero: function (s, l) {
			s = s.toString()
			if (l <= s.length) {
				return s
			}
			for (let i = 0; i < l - s.length; i++) {
				s = "0" + s
			}
			return s
		},
		resultTimestamp: function () {
			return this.timestamp
		},
		nextYear: function () {
			let date = new Date()
			date.setFullYear(date.getFullYear()+1)
			this.day = date.getFullYear() + "-" + this.leadingZero(date.getMonth() + 1, 2) + "-" + this.leadingZero(date.getDate(), 2)
			this.hour = this.leadingZero(date.getHours(), 2)
			this.minute = this.leadingZero(date.getMinutes(), 2)
			this.second = this.leadingZero(date.getSeconds(), 2)
			this.change()
		},
		nextDays: function (days) {
			let date = new Date()
			date.setTime(date.getTime() + days * 86400 * 1000)
			this.day = date.getFullYear() + "-" + this.leadingZero(date.getMonth() + 1, 2) + "-" + this.leadingZero(date.getDate(), 2)
			this.hour = this.leadingZero(date.getHours(), 2)
			this.minute = this.leadingZero(date.getMinutes(), 2)
			this.second = this.leadingZero(date.getSeconds(), 2)
			this.change()
		},
		nextHours: function (hours) {
			let date = new Date()
			date.setTime(date.getTime() + hours * 3600 * 1000)
			this.day = date.getFullYear() + "-" + this.leadingZero(date.getMonth() + 1, 2) + "-" + this.leadingZero(date.getDate(), 2)
			this.hour = this.leadingZero(date.getHours(), 2)
			this.minute = this.leadingZero(date.getMinutes(), 2)
			this.second = this.leadingZero(date.getSeconds(), 2)
			this.change()
		}
	},
	template: `<div>
	<input type="hidden" :name="vName" :value="timestamp"/>
	<div class="ui fields inline" style="padding: 0; margin:0">
		<div class="ui field" :class="{error: hasDayError}">
			<input type="text" v-model="day" placeholder="YYYY-MM-DD" style="width:8.6em" maxlength="10" @input="change" ref="dayInput"/>
		</div>
		<div class="ui field" :class="{error: hasHourError}"><input type="text" v-model="hour" maxlength="2" style="width:4em" placeholder="时" @input="change"/></div>
		<div class="ui field">:</div>
		<div class="ui field" :class="{error: hasMinuteError}"><input type="text" v-model="minute" maxlength="2" style="width:4em" placeholder="分" @input="change"/></div>
		<div class="ui field">:</div>
		<div class="ui field" :class="{error: hasSecondError}"><input type="text" v-model="second" maxlength="2" style="width:4em" placeholder="秒" @input="change"/></div>
	</div>
	<p class="comment">常用时间：<a href="" @click.prevent="nextHours(1)"> &nbsp;1小时&nbsp; </a> <span class="disabled">|</span> <a href="" @click.prevent="nextDays(1)"> &nbsp;1天&nbsp; </a> <span class="disabled">|</span> <a href="" @click.prevent="nextDays(3)"> &nbsp;3天&nbsp; </a> <span class="disabled">|</span> <a href="" @click.prevent="nextDays(7)"> &nbsp;1周&nbsp; </a> <span class="disabled">|</span> <a href="" @click.prevent="nextDays(30)"> &nbsp;30天&nbsp; </a> <span class="disabled">|</span> <a href="" @click.prevent="nextYear()"> &nbsp;1年&nbsp; </a> </p>
</div>`
})

Vue.component("more-options-angle", {
	data: function () {
		return {
			isVisible: false
		}
	},
	methods: {
		show: function () {
			this.isVisible = !this.isVisible
			this.$emit("change", this.isVisible)
		}
	},
	template: `<a href="" @click.prevent="show()"><span v-if="!isVisible">更多选项</span><span v-if="isVisible">收起选项</span><i class="icon angle" :class="{down:!isVisible, up:isVisible}"></i></a>`
})

Vue.component("countries-selector", {
	props: ["v-countries"],
	data: function () {
		let countries = this.vCountries
		if (countries == null) {
			countries = []
		}
		let countryIds = countries.$map(function (k, v) {
			return v.id
		})
		return {
			countries: countries,
			countryIds: countryIds
		}
	},
	methods: {
		add: function () {
			let countryStringIds = this.countryIds.map(function (v) {
				return v.toString()
			})
			let that = this
			teaweb.popup("/ui/selectCountriesPopup?countryIds=" + countryStringIds.join(","), {
				width: "48em",
				height: "23em",
				callback: function (resp) {
					that.countries = resp.data.countries
					that.change()
				}
			})
		},
		remove: function (index) {
			this.countries.$remove(index)
			this.change()
		},
		change: function () {
			this.countryIds = this.countries.$map(function (k, v) {
				return v.id
			})
		}
	},
	template: `<div>
	<input type="hidden" name="countryIdsJSON" :value="JSON.stringify(countryIds)"/>
	<div v-if="countries.length > 0" style="margin-bottom: 0.5em">
		<div v-for="(country, index) in countries" class="ui label tiny basic">{{country.name}} <a href="" title="删除" @click.prevent="remove(index)"><i class="icon remove"></i></a></div>
		<div class="ui divider"></div>
	</div>
	<div>
		<button class="ui button tiny" type="button" @click.prevent="add">+</button>
	</div>
</div>`
})

// 给Table增加排序功能
function sortTable(callback) {
	// 引入js
	let jsFile = document.createElement("script")
	jsFile.setAttribute("src", "/js/sortable.min.js")
	jsFile.addEventListener("load", function () {
		// 初始化
		let box = document.querySelector("#sortable-table")
		if (box == null) {
			return
		}
		Sortable.create(box, {
			draggable: "tbody",
			handle: ".icon.handle",
			onStart: function () {
			},
			onUpdate: function (event) {
				let rows = box.querySelectorAll("tbody")
				let rowIds = []
				rows.forEach(function (row) {
					rowIds.push(parseInt(row.getAttribute("v-id")))
				})
				callback(rowIds)
			}
		})
	})
	document.head.appendChild(jsFile)
}

function sortLoad(callback) {
	let jsFile = document.createElement("script")
	jsFile.setAttribute("src", "/js/sortable.min.js")
	jsFile.addEventListener("load", function () {
		if (typeof (callback) == "function") {
			callback()
		}
	})
	document.head.appendChild(jsFile)
}


/**
 * 二级菜单
 */
Vue.component("second-menu", {
	template: ' \
		<div class="second-menu"> \
			<div class="ui menu text blue small">\
				<slot></slot>\
			</div> \
			<div class="ui divider"></div> \
		</div>'
});

Vue.component("download-link", {
	props: ["v-element", "v-file"],
	created: function () {
		let that = this
		setTimeout(function () {
			that.url = that.composeURL()
		}, 1000)
	},
	data: function () {
		let filename = this.vFile
		if (filename == null || filename.length == 0) {
			filename = "unknown-file"
		}
		return {
			file: filename,
			url: this.composeURL()
		}
	},
	methods: {
		composeURL: function () {
			let e = document.getElementById(this.vElement)
			if (e == null) {
				teaweb.warn("找不到要下载的内容")
				return
			}
			let text = e.innerText
			if (text == null) {
				text = e.textContent
			}
			return Tea.url("/ui/download", {
				file: this.file,
				text: text
			})
		}
	},
	template: `<a :href="url" target="_blank" style="font-weight: normal"><slot></slot></a>`,
})

// 启用状态标签
Vue.component("label-on", {
	props: ["v-is-on"],
	template: '<div><span v-if="vIsOn" class="green">已启用</span><span v-if="!vIsOn" class="red">已停用</span></div>'
})

// 文字代码标签
Vue.component("code-label", {
	methods: {
		click: function (args) {
			this.$emit("click", args)
		}
	},
	template: `<span class="ui label basic small" style="padding: 3px;margin-left:2px;margin-right:2px" @click.prevent="click"><slot></slot></span>`
})

// tiny标签
Vue.component("tiny-label", {
	template: `<span class="ui label tiny" style="margin-bottom: 0.5em"><slot></slot></span>`
})

Vue.component("tiny-basic-label", {
	template: `<span class="ui label tiny basic" style="margin-bottom: 0.5em"><slot></slot></span>`
})

// 更小的标签
Vue.component("micro-basic-label", {
	template: `<span class="ui label tiny basic" style="margin-bottom: 0.5em; font-size: 0.7em; padding: 4px"><slot></slot></span>`
})


// 灰色的Label
Vue.component("grey-label", {
	template: `<span class="ui label basic grey tiny" style="margin-top: 0.4em; font-size: 0.7em; border: 1px solid #ddd!important; font-weight: normal;"><slot></slot></span>`
})

// Plus专属
Vue.component("plus-label", {
	template: `<span></span>`
})


// 将变量转换为中文
Vue.component("request-variables-describer", {
	data: function () {
		return {
			vars:[]
		}
	},
	methods: {
		update: function (variablesString) {
			this.vars = []
			let that = this
			variablesString.replace(/\${.+?}/g, function (v) {
				let def = that.findVar(v)
				if (def == null) {
					return v
				}
				that.vars.push(def)
			})
		},
		findVar: function (name) {
			let def = null
			window.REQUEST_VARIABLES.forEach(function (v) {
				if (v.code == name) {
					def = v
				}
			})
			return def
		}
	},
	template: `<span>
	<span v-for="(v, index) in vars"><code-label :title="v.description">{{v.code}}</code-label> - {{v.name}}<span v-if="index < vars.length-1">；</span></span>
</span>`
})


let radioId = 0
Vue.component("radio", {
	props: ["name", "value", "v-value", "id"],
	data: function () {
		radioId++
		let elementId = this.id
		if (elementId == null) {
			elementId = "radio" + radioId
		}
		return {
			"elementId": elementId
		}
	},
	methods: {
		change: function () {
			this.$emit("input", this.vValue)
		}
	},
	template: `<div class="ui checkbox radio">
	<input type="radio" :name="name" :value="vValue" :id="elementId" @change="change" :checked="(vValue == value)"/>
	<label :for="elementId"><slot></slot></label>
</div>`
})

Vue.component("combo-box", {
	// data-url 和 data-key 成对出现
	props: [
		"name", "title", "placeholder", "size", "v-items", "v-value",
		"data-url", // 数据源URL
		"data-key", // 数据源中数据的键名
		"data-search", // 是否启用动态搜索，如果值为on或true，则表示启用
		"width"
	],
	mounted: function () {
		if (this.dataURL.length > 0) {
			this.search("")
		}

		// 设定菜单宽度
		let searchBox = this.$refs.searchBox
		if (searchBox != null) {
			let inputWidth = searchBox.offsetWidth
			if (inputWidth != null && inputWidth > 0) {
				this.$refs.menu.style.width = inputWidth + "px"
			} else if (this.styleWidth.length > 0) {
				this.$refs.menu.style.width = this.styleWidth
			}
		}
	},
	data: function () {
		let items = this.vItems
		if (items == null || !(items instanceof Array)) {
			items = []
		}
		items = this.formatItems(items)

		// 当前选中项
		let selectedItem = null
		if (this.vValue != null) {
			let that = this
			items.forEach(function (v) {
				if (v.value == that.vValue) {
					selectedItem = v
				}
			})
		}

		let width = this.width
		if (width == null || width.length == 0) {
			width = "11em"
		} else {
			if (/\d+$/.test(width)) {
				width += "em"
			}
		}

		// data url
		let dataURL = ""
		if (typeof this.dataUrl == "string" && this.dataUrl.length > 0) {
			dataURL = this.dataUrl
		}

		return {
			allItems: items, // 原始的所有的items
			items: items.$copy(), // 候选的items
			selectedItem: selectedItem, // 选中的item
			keyword: "",
			visible: false,
			hideTimer: null,
			hoverIndex: 0,
			styleWidth: width,

			isInitial: true,
			dataURL: dataURL,
			urlRequestId: 0 // 记录URL请求ID，防止并行冲突
		}
	},
	methods: {
		search: function (keyword) {
			// 从URL中获取选项数据
			let dataUrl = this.dataURL
			let dataKey = this.dataKey
			let that = this

			let requestId = Math.random()
			this.urlRequestId = requestId

			Tea.action(dataUrl)
				.params({
					keyword: (keyword == null) ? "" : keyword
				})
				.post()
				.success(function (resp) {
					if (requestId != that.urlRequestId) {
						return
					}

					if (resp.data != null) {
						if (typeof (resp.data[dataKey]) == "object") {
							let items = that.formatItems(resp.data[dataKey])
							that.allItems = items
							that.items = items.$copy()

							if (that.isInitial) {
								that.isInitial = false
								if (that.vValue != null) {
									items.forEach(function (v) {
										if (v.value == that.vValue) {
											that.selectedItem = v
										}
									})
								}
							}
						}
					}
				})
		},
		formatItems: function (items) {
			items.forEach(function (v) {
				if (v.value == null) {
					v.value = v.id
				}
			})
			return items
		},
		reset: function () {
			this.selectedItem = null
			this.change()
			this.hoverIndex = 0

			let that = this
			setTimeout(function () {
				if (that.$refs.searchBox) {
					that.$refs.searchBox.focus()
				}
			})
		},
		clear: function () {
			this.selectedItem = null
			this.change()
			this.hoverIndex = 0
		},
		changeKeyword: function () {
			let shouldSearch = this.dataURL.length > 0 && (this.dataSearch == "on" || this.dataSearch == "true")

			this.hoverIndex = 0
			let keyword = this.keyword
			if (keyword.length == 0) {
				if (shouldSearch) {
					this.search(keyword)
				} else {
					this.items = this.allItems.$copy()
				}
				return
			}


			if (shouldSearch) {
				this.search(keyword)
			} else {
				this.items = this.allItems.$copy().filter(function (v) {
					if (v.fullname != null && v.fullname.length > 0 && teaweb.match(v.fullname, keyword)) {
						return true
					}
					return teaweb.match(v.name, keyword)
				})
			}
		},
		selectItem: function (item) {
			this.selectedItem = item
			this.change()
			this.hoverIndex = 0
			this.keyword = ""
			this.changeKeyword()
		},
		confirm: function () {
			if (this.items.length > this.hoverIndex) {
				this.selectItem(this.items[this.hoverIndex])
			}
		},
		show: function () {
			this.visible = true

			// 不要重置hoverIndex，以便焦点可以在输入框和可选项之间切换
		},
		hide: function () {
			let that = this
			this.hideTimer = setTimeout(function () {
				that.visible = false
			}, 500)
		},
		downItem: function () {
			this.hoverIndex++
			if (this.hoverIndex > this.items.length - 1) {
				this.hoverIndex = 0
			}
			this.focusItem()
		},
		upItem: function () {
			this.hoverIndex--
			if (this.hoverIndex < 0) {
				this.hoverIndex = 0
			}
			this.focusItem()
		},
		focusItem: function () {
			if (this.hoverIndex < this.items.length) {
				this.$refs.itemRef[this.hoverIndex].focus()
				let that = this
				setTimeout(function () {
					that.$refs.searchBox.focus()
					if (that.hideTimer != null) {
						clearTimeout(that.hideTimer)
						that.hideTimer = null
					}
				})
			}
		},
		change: function () {
			this.$emit("change", this.selectedItem)

			let that = this
			setTimeout(function () {
				if (that.$refs.selectedLabel != null) {
					that.$refs.selectedLabel.focus()
				}
			})
		},
		submitForm: function (event) {
			if (event.target.tagName != "A") {
				return
			}
			let parentBox = this.$refs.selectedLabel.parentNode
			while (true) {
				parentBox = parentBox.parentNode
				if (parentBox == null || parentBox.tagName == "BODY") {
					return
				}
				if (parentBox.tagName == "FORM") {
					parentBox.submit()
					break
				}
			}
		},

		setDataURL: function (dataURL) {
			this.dataURL = dataURL
		},
		reloadData: function () {
			this.search("")
		}
	},
	template: `<div style="display: inline; z-index: 10; background: white" class="combo-box">
	<!-- 搜索框 -->
	<div v-if="selectedItem == null">
		<input type="text" v-model="keyword" :placeholder="placeholder" :size="size" :style="{'width': styleWidth}"  @input="changeKeyword" @focus="show" @blur="hide" @keyup.enter="confirm()" @keypress.enter.prevent="1" ref="searchBox" @keydown.down.prevent="downItem" @keydown.up.prevent="upItem"/>
	</div>
	
	<!-- 当前选中 -->
	<div v-if="selectedItem != null">
		<input type="hidden" :name="name" :value="selectedItem.value"/>
		<span class="ui label basic" style="line-height: 1.4; font-weight: normal; font-size: 1em" ref="selectedLabel"><span><span v-if="title != null && title.length > 0">{{title}}：</span>{{selectedItem.name}}</span>
			<a href="" title="清除" @click.prevent="reset"><i class="icon remove small"></i></a>
		</span>
	</div>
	
	<!-- 菜单 -->
	<div v-show="selectedItem == null && items.length > 0 && visible">
		<div class="ui menu vertical small narrow-scrollbar" ref="menu">
			<a href="" v-for="(item, index) in items" ref="itemRef" class="item" :class="{active: index == hoverIndex, blue: index == hoverIndex}" @click.prevent="selectItem(item)" style="line-height: 1.4">
				<span v-if="item.fullname != null && item.fullname.length > 0">{{item.fullname}}</span>
				<span v-else>{{item.name}}</span>
			</a>
		</div>
	</div>
</div>`
})

/**
 * 菜单项
 */
Vue.component("menu-item", {
	props: ["href", "active", "code"],
	data: function () {
		let active = this.active
		if (typeof (active) == "undefined") {
			var itemCode = ""
			if (typeof (window.TEA.ACTION.data.firstMenuItem) != "undefined") {
				itemCode = window.TEA.ACTION.data.firstMenuItem
			}
			if (itemCode != null && itemCode.length > 0 && this.code != null && this.code.length > 0) {
				if (itemCode.indexOf(",") > 0) {
					active = itemCode.split(",").$contains(this.code)
				} else {
					active = (itemCode == this.code)
				}
			}
		}

		let href = (this.href == null) ? "" : this.href
		if (typeof (href) == "string" && href.length > 0 && href.startsWith(".")) {
			let qIndex = href.indexOf("?")
			if (qIndex >= 0) {
				href = Tea.url(href.substring(0, qIndex)) + href.substring(qIndex)
			} else {
				href = Tea.url(href)
			}
		}

		return {
			vHref: href,
			vActive: active
		}
	},
	methods: {
		click: function (e) {
			this.$emit("click", e)
		}
	},
	template: '\
		<a :href="vHref" class="item" :class="{active:vActive}" @click="click"><slot></slot></a> \
		'
});

// 排序使用的箭头
Vue.component("sort-arrow", {
	props: ["name"],
	data: function () {
		let url = window.location.toString()
		let order = ""
		let iconTitle = ""
		let newArgs = []
		if (window.location.search != null && window.location.search.length > 0) {
			let queryString = window.location.search.substring(1)
			let pieces = queryString.split("&")
			let that = this
			pieces.forEach(function (v) {
				let eqIndex = v.indexOf("=")
				if (eqIndex > 0) {
					let argName = v.substring(0, eqIndex)
					let argValue = v.substring(eqIndex + 1)
					if (argName == that.name) {
						order = argValue
					} else if (argName != "page" && argValue != "asc" && argValue != "desc") {
						newArgs.push(v)
					}
				} else {
					newArgs.push(v)
				}
			})
		}
		if (order == "asc") {
			newArgs.push(this.name + "=desc")
			iconTitle = "当前正序排列"
		} else if (order == "desc") {
			newArgs.push(this.name + "=asc")
			iconTitle = "当前倒序排列"
		} else {
			newArgs.push(this.name + "=desc")
			iconTitle = "当前正序排列"
		}

		let qIndex = url.indexOf("?")
		if (qIndex > 0) {
			url = url.substring(0, qIndex) + "?" + newArgs.join("&")
		} else {
			url = url + "?" + newArgs.join("&")
		}

		return {
			order: order,
			url: url,
			iconTitle: iconTitle
		}
	},
	template: `<a :href="url" :title="iconTitle">&nbsp; <i class="ui icon long arrow small" :class="{down: order == 'asc', up: order == 'desc', 'down grey': order == '' || order == null}"></i></a>`
})

Vue.component("search-box", {
	props: ["placeholder", "width"],
	data: function () {
		let width = this.width
		if (width == null) {
			width = "10em"
		}
		return {
			realWidth: width,
			realValue: ""
		}
	},
	methods: {
		onInput: function () {
			this.$emit("input", { value: this.realValue})
			this.$emit("change", { value: this.realValue})
		},
		clearValue: function () {
			this.realValue = ""
			this.focus()
			this.onInput()
		},
		focus: function () {
			this.$refs.valueRef.focus()
		}
	},
	template: `<div>
	<div class="ui input small" :class="{'right labeled': realValue.length > 0}">
		<input type="text" :placeholder="placeholder" :style="{width: realWidth}" @input="onInput" v-model="realValue" ref="valueRef"/>
		<a href="" class="ui label blue" v-if="realValue.length > 0" @click.prevent="clearValue" style="padding-right: 0"><i class="icon remove"></i></a>
	</div>
</div>`
})

Vue.component("js-page", {
	props: ["v-max"],
	data: function () {
		let max = this.vMax
		if (max == null) {
			max = 0
		}
		return {
			max: max,
			page: 1
		}
	},
	methods: {
		updateMax: function (max) {
			this.max = max
		},
		selectPage: function(page) {
			this.page = page
			this.$emit("change", page)
		}
	},
	template:`<div>
	<div class="page" v-if="max > 1">
		<a href="" v-for="i in max" :class="{active: i == page}" @click.prevent="selectPage(i)">{{i}}</a>
	</div>
</div>`
})

/**
 * 更多选项
 */
Vue.component("more-options-indicator", {
	data: function () {
		return {
			visible: false
		}
	},
	methods: {
		changeVisible: function () {
			this.visible = !this.visible
			if (Tea.Vue != null) {
				Tea.Vue.moreOptionsVisible = this.visible
			}
			this.$emit("change", this.visible)
			this.$emit("input", this.visible)
		}
	},
	template: '<a href="" style="font-weight: normal" @click.prevent="changeVisible()"><slot><span v-if="!visible">更多选项</span><span v-if="visible">收起选项</span></slot> <i class="icon angle" :class="{down:!visible, up:visible}"></i> </a>'
});

Vue.component("time-duration-box", {
	props: ["v-name", "v-value", "v-count", "v-unit", "placeholder", "v-min-unit", "maxlength"],
	mounted: function () {
		this.change()
	},
	data: function () {
		let v = this.vValue
		if (v == null) {
			v = {
				count: this.vCount,
				unit: this.vUnit
			}
		}
		if (typeof (v["count"]) != "number") {
			v["count"] = -1
		}

		let minUnit = this.vMinUnit
		let units = [
			{
				code: "ms",
				name: "毫秒"
			},
			{
				code: "second",
				name: "秒"
			},
			{
				code: "minute",
				name: "分钟"
			},
			{
				code: "hour",
				name: "小时"
			},
			{
				code: "day",
				name: "天"
			}
		]
		let minUnitIndex = -1
		if (minUnit != null && typeof minUnit == "string" && minUnit.length > 0) {
			for (let i = 0; i < units.length; i++) {
				if (units[i].code == minUnit) {
					minUnitIndex = i
					break
				}
			}
		}
		if (minUnitIndex > -1) {
			units = units.slice(minUnitIndex)
		}

		let maxLength = parseInt(this.maxlength)
		if (typeof maxLength != "number") {
			maxLength = 10
		}

		return {
			duration: v,
			countString: (v.count >= 0) ? v.count.toString() : "",
			units: units,
			realMaxLength: maxLength
		}
	},
	watch: {
		"countString": function (newValue) {
			let value = newValue.trim()
			if (value.length == 0) {
				this.duration.count = -1
				return
			}
			let count = parseInt(value)
			if (!isNaN(count)) {
				this.duration.count = count
			}
			this.change()
		}
	},
	methods: {
		change: function () {
			this.$emit("change", this.duration)
		}
	},
	template: `<div class="ui fields inline" style="padding-bottom: 0; margin-bottom: 0">
	<input type="hidden" :name="vName" :value="JSON.stringify(duration)"/>
	<div class="ui field">
		<input type="text" v-model="countString" :maxlength="realMaxLength" :size="realMaxLength" :placeholder="placeholder" @keypress.enter.prevent="1"/>
	</div>
	<div class="ui field">
		<select class="ui dropdown" v-model="duration.unit" @change="change">
			<option v-for="unit in units" :value="unit.code">{{unit.name}}</option>
		</select>
	</div>
</div>`
})

Vue.component("time-duration-text", {
	props: ["v-value"],
	methods: {
		unitName: function (unit) {
			switch (unit) {
				case "ms":
					return "毫秒"
				case "second":
					return "秒"
				case "minute":
					return "分钟"
				case "hour":
					return "小时"
				case "day":
					return "天"
			}
		}
	},
	template: `<span>
	{{vValue.count}} {{unitName(vValue.unit)}}
</span>`
})

// 警告消息
Vue.component("warning-message", {
	template: `<div class="ui icon message warning"><i class="icon warning circle"></i><div class="content"><slot></slot></div></div>`
})

let sourceCodeBoxIndex = 0

Vue.component("source-code-box", {
	props: ["name", "type", "id", "read-only", "width", "height", "focus"],
	mounted: function () {
		let readOnly = this.readOnly
		if (typeof readOnly != "boolean") {
			readOnly = true
		}
		let box = document.getElementById("source-code-box-" + this.index)
		let valueBox = document.getElementById(this.valueBoxId)
		let value = ""
		if (valueBox.textContent != null) {
			value = valueBox.textContent
		} else if (valueBox.innerText != null) {
			value = valueBox.innerText
		}

		this.createEditor(box, value, readOnly)
	},
	data: function () {
		let index = sourceCodeBoxIndex++

		let valueBoxId = 'source-code-box-value-' + sourceCodeBoxIndex
		if (this.id != null) {
			valueBoxId = this.id
		}

		return {
			index: index,
			valueBoxId: valueBoxId
		}
	},
	methods: {
		createEditor: function (box, value, readOnly) {
			let boxEditor = CodeMirror.fromTextArea(box, {
				theme: "idea",
				lineNumbers: true,
				value: "",
				readOnly: readOnly,
				showCursorWhenSelecting: true,
				height: "auto",
				//scrollbarStyle: null,
				viewportMargin: Infinity,
				lineWrapping: true,
				highlightFormatting: false,
				indentUnit: 4,
				indentWithTabs: true,
			})
			let that = this
			boxEditor.on("change", function () {
				that.change(boxEditor.getValue())
			})
			boxEditor.setValue(value)

			if (this.focus) {
				boxEditor.focus()
			}

			let width = this.width
			let height = this.height
			if (width != null && height != null) {
				width = parseInt(width)
				height = parseInt(height)
				if (!isNaN(width) && !isNaN(height)) {
					if (width <= 0) {
						width = box.parentNode.offsetWidth
					}
					boxEditor.setSize(width, height)
				}
			} else if (height != null) {
				height = parseInt(height)
				if (!isNaN(height)) {
					boxEditor.setSize("100%", height)
				}
			}

			let info = CodeMirror.findModeByMIME(this.type)
			if (info != null) {
				boxEditor.setOption("mode", info.mode)
				CodeMirror.modeURL = "/codemirror/mode/%N/%N.js"
				CodeMirror.autoLoadMode(boxEditor, info.mode)
			}
		},
		change: function (code) {
			this.$emit("change", code)
		}
	},
	template: `<div class="source-code-box">
	<div style="display: none" :id="valueBoxId"><slot></slot></div>
	<textarea :id="'source-code-box-' + index" :name="name"></textarea>
</div>`
})

Vue.component("more-options-tbody", {
	data: function () {
		return {
			isVisible: false
		}
	},
	methods: {
		show: function () {
			this.isVisible = !this.isVisible
			this.$emit("change", this.isVisible)
		}
	},
	template: `<tbody>
	<tr>
		<td colspan="2"><a href="" @click.prevent="show()"><span v-if="!isVisible">更多选项</span><span v-if="isVisible">收起选项</span><i class="icon angle" :class="{down:!isVisible, up:isVisible}"></i></a></td>
	</tr>
</tbody>`
})

Vue.component("size-capacity-box", {
	props: ["v-name", "v-value", "v-count", "v-unit", "size", "maxlength"],
	data: function () {
		let v = this.vValue
		if (v == null) {
			v = {
				count: this.vCount,
				unit: this.vUnit
			}
		}
		if (typeof (v["count"]) != "number") {
			v["count"] = -1
		}

		let vSize = this.size
		if (vSize == null) {
			vSize = 6
		}

		let vMaxlength = this.maxlength
		if (vMaxlength == null) {
			vMaxlength = 10
		}

		return {
			capacity: v,
			countString: (v.count >= 0) ? v.count.toString() : "",
			vSize: vSize,
			vMaxlength: vMaxlength
		}
	},
	watch: {
		"countString": function (newValue) {
			let value = newValue.trim()
			if (value.length == 0) {
				this.capacity.count = -1
				this.change()
				return
			}
			let count = parseInt(value)
			if (!isNaN(count)) {
				this.capacity.count = count
			}
			this.change()
		}
	},
	methods: {
		change: function () {
			this.$emit("change", this.capacity)
		}
	},
	template: `<div class="ui fields inline">
	<input type="hidden" :name="vName" :value="JSON.stringify(capacity)"/>
	<div class="ui field">
		<input type="text" v-model="countString" :maxlength="vMaxlength" :size="vSize"/>
	</div>
	<div class="ui field">
		<select class="ui dropdown" v-model="capacity.unit" @change="change">
			<option value="byte">字节</option>
			<option value="kb">KiB</option>
			<option value="mb">MiB</option>
			<option value="gb">GiB</option>
		</select>
	</div>
</div>`
})

Vue.component("provinces-selector", {
	props: ["v-provinces"],
	data: function () {
		let provinces = this.vProvinces
		if (provinces == null) {
			provinces = []
		}
		let provinceIds = provinces.$map(function (k, v) {
			return v.id
		})
		return {
			provinces: provinces,
			provinceIds: provinceIds
		}
	},
	methods: {
		add: function () {
			let provinceStringIds = this.provinceIds.map(function (v) {
				return v.toString()
			})
			let that = this
			teaweb.popup("/ui/selectProvincesPopup?provinceIds=" + provinceStringIds.join(","), {
				width: "48em",
				height: "23em",
				callback: function (resp) {
					that.provinces = resp.data.provinces
					that.change()
				}
			})
		},
		remove: function (index) {
			this.provinces.$remove(index)
			this.change()
		},
		change: function () {
			this.provinceIds = this.provinces.$map(function (k, v) {
				return v.id
			})
		}
	},
	template: `<div>
	<input type="hidden" name="provinceIdsJSON" :value="JSON.stringify(provinceIds)"/>
	<div v-if="provinces.length > 0" style="margin-bottom: 0.5em">
		<div v-for="(province, index) in provinces" class="ui label tiny basic">{{province.name}} <a href="" title="删除" @click.prevent="remove(index)"><i class="icon remove"></i></a></div>
		<div class="ui divider"></div>
	</div>
	<div>
		<button class="ui button tiny" type="button" @click.prevent="add">+</button>
	</div>
</div>`
})

Vue.component("network-addresses-box", {
	props: ["v-server-type", "v-addresses", "v-protocol", "v-name"],
	data: function () {
		let addresses = this.vAddresses
		if (addresses == null) {
			addresses = []
		}
		let protocol = this.vProtocol
		if (protocol == null) {
			protocol = ""
		}

		let name = this.vName
		if (name == null) {
			name = "addresses"
		}

		return {
			addresses: addresses,
			protocol: protocol,
			name: name
		}
	},
	watch: {
		"vServerType": function () {
			this.addresses = []
		}
	},
	methods: {
		addAddr: function () {
			let that = this
			window.UPDATING_ADDR = null
			teaweb.popup("/servers/addPortPopup?serverType=" + this.vServerType + "&protocol=" + this.protocol, {
				height: "16em",
				callback: function (resp) {
					var addr = resp.data.address
					that.addresses.push(addr)
					if (["https", "https4", "https6"].$contains(addr.protocol)) {
						this.tlsProtocolName = "HTTPS"
					} else if (["tls", "tls4", "tls6"].$contains(addr.protocol)) {
						this.tlsProtocolName = "TLS"
					}

					// 发送事件
					that.$emit("change", that.addresses)
				}
			})
		},
		removeAddr: function (index) {
			this.addresses.$remove(index);

			// 发送事件
			this.$emit("change", this.addresses)
		},
		updateAddr: function (index, addr) {
			let that = this
			window.UPDATING_ADDR = addr
			teaweb.popup("/servers/addPortPopup?serverType=" + this.vServerType + "&protocol=" + this.protocol, {
				height: "16em",
				callback: function (resp) {
					var addr = resp.data.address
					Vue.set(that.addresses, index, addr)

					if (["https", "https4", "https6"].$contains(addr.protocol)) {
						this.tlsProtocolName = "HTTPS"
					} else if (["tls", "tls4", "tls6"].$contains(addr.protocol)) {
						this.tlsProtocolName = "TLS"
					}

					// 发送事件
					that.$emit("change", that.addresses)
				}
			})

			// 发送事件
			this.$emit("change", this.addresses)
		}
	},
	template: `<div>
	<input type="hidden" :name="name" :value="JSON.stringify(addresses)"/>
	<div v-if="addresses.length > 0">
		<div class="ui label small basic" v-for="(addr, index) in addresses">
			{{addr.protocol}}://<span v-if="addr.host.length > 0">{{addr.host}}</span><span v-if="addr.host.length == 0">*</span>:{{addr.portRange}}
			<a href="" @click.prevent="updateAddr(index, addr)" title="修改"><i class="icon pencil small"></i></a>
			<a href="" @click.prevent="removeAddr(index)" title="删除"><i class="icon remove"></i></a> </div>
		<div class="ui divider"></div>
	</div>
	<a href="" @click.prevent="addAddr()">[添加端口绑定]</a>
</div>`
})

Vue.component("values-box", {
	props: ["values", "v-values", "size", "maxlength", "name", "placeholder", "v-allow-empty", "validator"],
	data: function () {
		let values = this.values;
		if (values == null) {
			values = [];
		}

		if (this.vValues != null && typeof this.vValues == "object") {
			values = this.vValues
		}

		return {
			"realValues": values,
			"isUpdating": false,
			"isAdding": false,
			"index": 0,
			"value": "",
			isEditing: false
		}
	},
	methods: {
		create: function () {
			this.isAdding = true;
			var that = this;
			setTimeout(function () {
				that.$refs.value.focus();
			}, 200);
		},
		update: function (index) {
			this.cancel()
			this.isUpdating = true;
			this.index = index;
			this.value = this.realValues[index];
			var that = this;
			setTimeout(function () {
				that.$refs.value.focus();
			}, 200);
		},
		confirm: function () {
			if (this.value.length == 0) {
				if (typeof(this.vAllowEmpty) != "boolean" || !this.vAllowEmpty) {
					return
				}
			}

			// validate
			if (typeof(this.validator) == "function") {
				let resp = this.validator.call(this, this.value)
				if (typeof resp == "object") {
					if (typeof resp.isOk == "boolean" && !resp.isOk) {
						if (typeof resp.message == "string") {
							let that = this
							teaweb.warn(resp.message, function () {
								that.$refs.value.focus();
							})
						}
						return
					}
				}
			}

			if (this.isUpdating) {
				Vue.set(this.realValues, this.index, this.value);
			} else {
				this.realValues.push(this.value);
			}
			this.cancel()
			this.$emit("change", this.realValues)
		},
		remove: function (index) {
			this.realValues.$remove(index)
			this.$emit("change", this.realValues)
		},
		cancel: function () {
			this.isUpdating = false;
			this.isAdding = false;
			this.value = "";
		},
		updateAll: function (values) {
			this.realValues = values
		},
		addValue: function (v) {
			this.realValues.push(v)
		},

		startEditing: function () {
			this.isEditing = !this.isEditing
		},
		allValues: function () {
			return this.realValues
		}
	},
	template: `<div>
	<div v-show="!isEditing && realValues.length > 0">
		<div class="ui label tiny basic" v-for="(value, index) in realValues" style="margin-top:0.4em;margin-bottom:0.4em">
			<span v-if="value.toString().length > 0">{{value}}</span>
			<span v-if="value.toString().length == 0" class="disabled">[空]</span>
		</div>
		<a href="" @click.prevent="startEditing" style="font-size: 0.8em; margin-left: 0.2em">[修改]</a>
	</div>
	<div v-show="isEditing || realValues.length == 0">
		<div style="margin-bottom: 1em" v-if="realValues.length > 0">
			<div class="ui label tiny basic" v-for="(value, index) in realValues" style="margin-top:0.4em;margin-bottom:0.4em">
				<span v-if="value.toString().length > 0">{{value}}</span>
				<span v-if="value.toString().length == 0" class="disabled">[空]</span>
				<input type="hidden" :name="name" :value="value"/>
				&nbsp; <a href="" @click.prevent="update(index)" title="修改"><i class="icon pencil small" ></i></a> 
				<a href="" @click.prevent="remove(index)" title="删除"><i class="icon remove"></i></a> 
			</div> 
			<div class="ui divider"></div>
		</div> 
		<!-- 添加|修改 -->
		<div v-if="isAdding || isUpdating">
			<div class="ui fields inline">
				<div class="ui field">
					<input type="text" :size="size" :maxlength="maxlength" :placeholder="placeholder" v-model="value" ref="value" @keyup.enter="confirm()" @keypress.enter.prevent="1"/>
				</div> 
				<div class="ui field">
					<button class="ui button small" type="button" @click.prevent="confirm()">确定</button> 
				</div>
				<div class="ui field">
					<a href="" @click.prevent="cancel()" title="取消"><i class="icon remove small"></i></a> 
				</div> 
			</div> 
		</div> 
		<div v-if="!isAdding && !isUpdating">
			<button class="ui button tiny" type="button" @click.prevent="create()">+</button> 
		</div>
	</div>	
</div>`
});

/**
 * 保存按钮
 */
Vue.component("submit-btn", {
	template: '<button class="ui button primary" type="submit"><slot>保存</slot></button>'
});

Vue.component("network-addresses-view", {
	props: ["v-addresses"],
	template: `<div>
	<div class="ui label tiny basic" v-if="vAddresses != null" v-for="addr in vAddresses">
		{{addr.protocol}}://{{addr.host}}:{{addr.portRange}}
	</div>
</div>`
})

Vue.component("not-found-box", {
	props: ["message"],
	template: `<div style="text-align: center; margin-top: 5em;">
	<div style="font-size: 2em; margin-bottom: 1em"><i class="icon exclamation triangle large grey"></i></div>
	<p class="comment">{{message}}<slot></slot></p>
</div>`
})

Vue.component("bandwidth-size-capacity-view", {
	props: ["v-value"],
	data: function () {
		let capacity = this.vValue
		if (capacity != null && capacity.count > 0 && typeof capacity.unit === "string") {
			capacity.unit = capacity.unit[0].toUpperCase() + capacity.unit.substring(1) + "ps"
		}
		return {
			capacity: capacity
		}
	},
	template: `<span>
	<span v-if="capacity != null && capacity.count > 0">{{capacity.count}}{{capacity.unit}}</span>
</span>`
})

/**
 * 二级菜单
 */
Vue.component("inner-menu", {
	template: `
		<div class="second-menu" style="width:80%;position: absolute;top:-8px;right:1em"> 
			<div class="ui menu text blue small">
				<slot></slot>
			</div> 
		</div>`
});

Vue.component("ip-item-text", {
	props: ["v-item"],
	template: `<span>
    <span v-if="vItem.type == 'all'">*</span>
    <span v-else>
    	<span v-if="vItem.value != null && vItem.value.length > 0">{{vItem.value}}</span>
    	<span v-else>
			{{vItem.ipFrom}}
			<span v-if="vItem.ipTo != null &&vItem.ipTo.length > 0">- {{vItem.ipTo}}</span>
		</span>
	</span>
    <span v-if="vItem.eventLevelName != null && vItem.eventLevelName.length > 0">&nbsp; 级别：{{vItem.eventLevelName}}</span>
</span>`
})

// 绑定IP列表
Vue.component("ip-list-bind-box", {
	props: ["v-http-firewall-policy-id", "v-type"],
	mounted: function () {
		this.refresh()
	},
	data: function () {
		return {
			policyId: this.vHttpFirewallPolicyId,
			type: this.vType,
			lists: []
		}
	},
	methods: {
		bind: function () {
			let that = this
			teaweb.popup("/servers/iplists/bindHTTPFirewallPopup?httpFirewallPolicyId=" + this.policyId + "&type=" + this.type, {
				width: "50em",
				height: "34em",
				callback: function () {

				},
				onClose: function () {
					that.refresh()
				}
			})
		},
		remove: function (index, listId) {
			let that = this
			teaweb.confirm("确定要删除这个绑定的IP名单吗？", function () {
				Tea.action("/servers/iplists/unbindHTTPFirewall")
					.params({
						httpFirewallPolicyId: that.policyId,
						listId: listId
					})
					.post()
					.success(function (resp) {
						that.lists.$remove(index)
					})
			})
		},
		refresh: function () {
			let that = this
			Tea.action("/servers/iplists/httpFirewall")
				.params({
					httpFirewallPolicyId: this.policyId,
					type: this.vType
				})
				.post()
				.success(function (resp) {
					that.lists = resp.data.lists
				})
		}
	},
	template: `<div>
	<a href="" @click.prevent="bind()" style="color: rgba(0,0,0,.6)">绑定+</a> &nbsp; <span v-if="lists.length > 0"><span class="disabled small">|&nbsp;</span> 已绑定：</span>
	<div class="ui label basic small" v-for="(list, index) in lists">
		<a :href="'/servers/iplists/list?listId=' + list.id" title="点击查看详情" style="opacity: 1">{{list.name}}</a>
		<a href="" title="删除" @click.prevent="remove(index, list.id)"><i class="icon remove small"></i></a>
	</div>
</div>`
})

Vue.component("ip-box", {
	props: ["v-ip"],
	methods: {
		popup: function () {
			let ip = this.vIp
			if (ip == null || ip.length == 0) {
				let e = this.$refs.container
				ip = e.innerText
				if (ip == null) {
					ip = e.textContent
				}
			}

			teaweb.popup("/servers/ipbox?ip=" + ip, {
				width: "50em",
				height: "30em"
			})
		}
	},
	template: `<span @click.prevent="popup()" ref="container"><slot></slot></span>`
})

Vue.component("ip-list-table", {
	props: ["v-items", "v-keyword", "v-show-search-button"],
	data: function () {
		return {
			items: this.vItems,
			keyword: (this.vKeyword != null) ? this.vKeyword : "",
			selectedAll: false,
			hasSelectedItems: false
		}
	},
	methods: {
		updateItem: function (itemId) {
			this.$emit("update-item", itemId)
		},
		deleteItem: function (itemId) {
			this.$emit("delete-item", itemId)
		},
		viewLogs: function (itemId) {
			teaweb.popup("/waf/iplists/accessLogsPopup?itemId=" + itemId, {
				width: "50em",
				height: "30em"
			})
		},
		changeSelectedAll: function () {
			let boxes = this.$refs.itemCheckBox
			if (boxes == null) {
				return
			}

			let that = this
			boxes.forEach(function (box) {
				box.checked = that.selectedAll
			})

			this.hasSelectedItems = this.selectedAll
		},
		changeSelected: function (e) {
			let that = this
			that.hasSelectedItems = false
			let boxes = that.$refs.itemCheckBox
			if (boxes == null) {
				return
			}
			boxes.forEach(function (box) {
				if (box.checked) {
					that.hasSelectedItems = true
				}
			})
		},
		deleteAll: function () {
			let boxes = this.$refs.itemCheckBox
			if (boxes == null) {
				return
			}
			let itemIds = []
			boxes.forEach(function (box) {
				if (box.checked) {
					itemIds.push(box.value)
				}
			})
			if (itemIds.length == 0) {
				return
			}

			Tea.action("/waf/iplists/deleteItems")
				.post()
				.params({
					itemIds: itemIds
				})
				.success(function () {
					teaweb.successToast("批量删除成功", 1200, teaweb.reload)
				})
		},
		formatSeconds: function (seconds) {
			if (seconds < 60) {
				return seconds + "秒"
			}
			if (seconds < 3600) {
				return Math.ceil(seconds / 60) + "分钟"
			}
			if (seconds < 86400) {
				return Math.ceil(seconds / 3600) + "小时"
			}
			return Math.ceil(seconds / 86400) + "天"
		}
	},
	template: `<div>
 <div v-show="hasSelectedItems">
 	<div class="ui divider"></div>
 	<button class="ui button basic" type="button" @click.prevent="deleteAll">批量删除所选</button>
</div>
 <table class="ui table selectable celled" v-if="items.length > 0">
        <thead>
            <tr>
            	<th style="width: 1em">
            		<div class="ui checkbox">
						<input type="checkbox" v-model="selectedAll" @change="changeSelectedAll"/>
						<label></label>
					</div>
				</th>
                <th style="width:18em">IP</th>
                <th style="width: 6em">类型</th>
                <th style="width: 6em">级别</th>
                <th style="width: 12em">过期时间</th>
                <th>备注</th>
                <th class="two op">操作</th>
            </tr>
        </thead>
		<tbody v-for="item in items">
			<tr>
				<td>
					<div class="ui checkbox">
						<input type="checkbox" :value="item.id" @change="changeSelected" ref="itemCheckBox"/>
						<label></label>
					</div>
				</td>
				<td>
					<span v-if="item.type != 'all'" :class="{green: item.list != null && item.list.type == 'white'}">
						<span v-if="item.value != null && item.value.length > 0"><keyword :v-word="keyword">{{item.value}}</keyword></span>
						<span v-else>
							<keyword :v-word="keyword">{{item.ipFrom}}</keyword> <span> <span class="small red" v-if="item.isRead != null && !item.isRead">&nbsp;New&nbsp;</span>&nbsp;<a :href="'/servers/iplists?ip=' + item.ipFrom" v-if="vShowSearchButton" title="搜索此IP"><span><i class="icon search small" style="color: #ccc"></i></span></a></span>
							<span v-if="item.ipTo.length > 0"> - <keyword :v-word="keyword">{{item.ipTo}}</keyword></span>
						</span>
					</span>
					
					<div v-if="item.region != null && item.region.length > 0">
						<span class="grey small">{{item.region}}</span>
						<span v-if="item.isp != null && item.isp.length > 0 && item.isp != '内网IP'" class="grey small"><span class="disabled">|</span> {{item.isp}}</span>
					</div>
					<div v-else-if="item.isp != null && item.isp.length > 0 && item.isp != '内网IP'"><span class="grey small">{{item.isp}}</span></div>
					
					<div v-if="item.createdTime != null">
						<span class="small grey">添加于 {{item.createdTime}}
							<span v-if="item.list != null && item.list.id > 0">
								@ 
								
								<a :href="'/waf/iplists/list?listId=' + item.list.id" v-if="item.policy.id == 0"><span>[<span v-if="item.list.type == 'black'">黑</span><span v-if="item.list.type == 'white'">白</span><span v-if="item.list.type == 'grey'">灰</span>名单：{{item.list.name}}]</span></a>
								<span v-else>[<span v-if="item.list.type == 'black'">黑</span><span v-if="item.list.type == 'white'">白</span><span v-if="item.list.type == 'grey'">灰</span>名单：{{item.list.name}}</span>
								
								<span v-if="item.policy.id > 0">
									<span v-if="item.policy.server != null">
										<a :href="'/servers/server/settings/waf/ipadmin/allowList?serverId=' + item.policy.server.id + '&firewallPolicyId=' + item.policy.id" v-if="item.list.type == 'white'">[网站：{{item.policy.server.name}}]</a>
										<a :href="'/servers/server/settings/waf/ipadmin/denyList?serverId=' + item.policy.server.id + '&firewallPolicyId=' + item.policy.id" v-if="item.list.type == 'black'">[网站：{{item.policy.server.name}}]</a>
										<a :href="'/servers/server/settings/waf/ipadmin/greyList?serverId=' + item.policy.server.id + '&firewallPolicyId=' + item.policy.id" v-if="item.list.type == 'grey'">[网站：{{item.policy.server.name}}]</a>
									</span>
								</span>
							</span>
						</span>
					</div>
				</td>
				<td>
					<span v-if="item.type.length == 0">IPv4</span>
					<span v-else-if="item.type == 'ipv4'">IPv4</span>
					<span v-else-if="item.type == 'ipv6'">IPv6</span>
					<span v-else-if="item.type == 'all'"><strong>所有IP</strong></span>
				</td>
				<td>
					<span v-if="item.eventLevelName != null && item.eventLevelName.length > 0">{{item.eventLevelName}}</span>
					<span v-else class="disabled">-</span>
				</td>
				<td>
					<div v-if="item.expiredTime.length > 0">
						{{item.expiredTime}}
						<div v-if="item.isExpired && item.lifeSeconds == null" style="margin-top: 0.5em">
							<span class="ui label tiny basic red">已过期</span>
						</div>
						<div  v-if="item.lifeSeconds != null">
							<span class="small grey" v-if="item.lifeSeconds > 0">{{formatSeconds(item.lifeSeconds)}}</span>
							<span class="small red" v-if="item.lifeSeconds < 0">已过期</span>
						</div>
					</div>
					<span v-else class="disabled">不过期</span>
				</td>
				<td>
					<span v-if="item.reason.length > 0">{{item.reason}}</span>
					<span v-else class="disabled">-</span>
			
					<div style="margin-top: 0.4em" v-if="item.sourceServer != null && item.sourceServer.id > 0">
						<a :href="'/servers/server?serverId=' + item.sourceServer.id" style="border: 0"><span class="small "><i class="icon clone outline"></i>{{item.sourceServer.name}}</span></a>
					</div>
					<div v-if="item.sourcePolicy != null && item.sourcePolicy.id > 0" style="margin-top: 0.4em">
						<a :href="'/servers/server/settings/waf/group?serverId=' + item.sourcePolicy.serverId + '&firewallPolicyId=' + item.sourcePolicy.id + '&type=inbound&groupId=' + item.sourceGroup.id + '#set' + item.sourceSet.id" v-if="item.sourcePolicy.serverId > 0"><span class="small "><i class="icon shield"></i> {{item.sourcePolicy.name}} &raquo; {{item.sourceGroup.name}} &raquo; {{item.sourceSet.name}}</span></a>
					</div>
				</td>
				<td>
					<!--<a href="" @click.prevent="viewLogs(item.id)">日志</a> &nbsp;-->
					<a href="" @click.prevent="updateItem(item.id)">修改</a> &nbsp;
					<a href="" @click.prevent="deleteItem(item.id)">删除</a>
				</td>
			</tr>
        </tbody>
    </table>
</div>`
})

Vue.component("origin-list-box", {
	props: ["v-primary-origins", "v-backup-origins", "v-server-type", "v-params"],
	data: function () {
		return {
			primaryOrigins: this.vPrimaryOrigins,
			backupOrigins: this.vBackupOrigins
		}
	},
	methods: {
		createPrimaryOrigin: function () {
			teaweb.popup("/servers/server/settings/origins/addPopup?originType=primary&" + this.vParams, {
				width: "45em",
				height: "27em",
				callback: function (resp) {
					teaweb.success("保存成功", function () {
						window.location.reload()
					})
				}
			})
		},
		createBackupOrigin: function () {
			teaweb.popup("/servers/server/settings/origins/addPopup?originType=backup&" + this.vParams, {
				width: "45em",
				height: "27em",
				callback: function (resp) {
					teaweb.success("保存成功", function () {
						window.location.reload()
					})
				}
			})
		},
		updateOrigin: function (originId, originType) {
			teaweb.popup("/servers/server/settings/origins/updatePopup?originType=" + originType + "&" + this.vParams + "&originId=" + originId, {
				width: "45em",
				height: "27em",
				callback: function (resp) {
					teaweb.success("保存成功", function () {
						window.location.reload()
					})
				}
			})
		},
		deleteOrigin: function (originId, originAddr, originType) {
			let that = this
			teaweb.confirm("确定要删除此源站（" + originAddr + "）吗？", function () {
				Tea.action("/servers/server/settings/origins/delete?" + that.vParams + "&originId=" + originId + "&originType=" + originType)
					.post()
					.success(function () {
						teaweb.success("删除成功", function () {
							window.location.reload()
						})
					})
			})
		},
		updateOriginIsOn: function (originId, originAddr, isOn) {
			let message
			let resultMessage
			if (isOn) {
				message = "确定要启用此源站（" + originAddr + "）吗？"
				resultMessage = "启用成功"
			} else {
				message = "确定要停用此源站（" + originAddr + "）吗？"
				resultMessage = "停用成功"
			}
			let that = this
			teaweb.confirm(message, function () {
				Tea.action("/servers/server/settings/origins/updateIsOn?" + that.vParams + "&originId=" + originId + "&isOn=" + (isOn ? 1 : 0))
					.post()
					.success(function () {
						teaweb.success(resultMessage, function () {
							window.location.reload()
						})
					})
			})
		}
	},
	template: `<div>
	<h3>主要源站 <a href="" @click.prevent="createPrimaryOrigin()">[添加主要源站]</a> </h3>
	<p class="comment" v-if="primaryOrigins.length == 0">暂时还没有主要源站。</p>
	<origin-list-table v-if="primaryOrigins.length > 0" :v-origins="vPrimaryOrigins" :v-origin-type="'primary'" @delete-origin="deleteOrigin" @update-origin="updateOrigin" @update-origin-is-on="updateOriginIsOn"></origin-list-table>

	<h3>备用源站 <a href="" @click.prevent="createBackupOrigin()">[添加备用源站]</a></h3>
	<p class="comment" v-if="backupOrigins.length == 0">暂时还没有备用源站。</p>
	<origin-list-table v-if="backupOrigins.length > 0" :v-origins="backupOrigins" :v-origin-type="'backup'" @delete-origin="deleteOrigin" @update-origin="updateOrigin" @update-origin-is-on="updateOriginIsOn"></origin-list-table>
</div>`
})

Vue.component("origin-list-table", {
	props: ["v-origins", "v-origin-type"],
	data: function () {
		let hasMatchedDomains = false
		let origins = this.vOrigins
		if (origins != null && origins.length > 0) {
			origins.forEach(function (origin) {
				if (origin.domains != null && origin.domains.length > 0) {
					hasMatchedDomains = true
				}
			})
		}

		return {
			hasMatchedDomains: hasMatchedDomains
		}
	},
	methods: {
		deleteOrigin: function (originId, originAddr) {
			this.$emit("delete-origin", originId, originAddr, this.vOriginType)
		},
		updateOrigin: function (originId) {
			this.$emit("update-origin", originId, this.vOriginType)
		},
		updateOriginIsOn: function (originId, originAddr, isOn) {
			this.$emit("update-origin-is-on", originId, originAddr, isOn)
		}
	},
	template: `
<table class="ui table selectable">
	<thead>
		<tr>
			<th>源站地址</th>
			<th class="width5">权重</th>
			<th class="width6">状态</th>
			<th class="three op">操作</th>
		</tr>	
	</thead>
	<tbody>
		<tr v-for="origin in vOrigins">
			<td :class="{disabled:!origin.isOn}">
				<a href="" @click.prevent="updateOrigin(origin.id)" :class="{disabled:!origin.isOn}">{{origin.addr}} &nbsp;<i class="icon expand small"></i></a>
				<div style="margin-top: 0.3em">
					<tiny-basic-label class="grey border-grey" v-if="origin.isOSS"><i class="icon hdd outline"></i>对象存储</tiny-basic-label>
					<tiny-basic-label class="grey border-grey" v-if="origin.name.length > 0">{{origin.name}}</tiny-basic-label>
					<tiny-basic-label class="grey border-grey" v-if="origin.hasCert">证书</tiny-basic-label>
					<tiny-basic-label class="grey border-grey" v-if="origin.host != null && origin.host.length > 0">主机名: {{origin.host}}</tiny-basic-label>
					<tiny-basic-label class="grey border-grey" v-if="origin.followPort">端口跟随</tiny-basic-label>
					<tiny-basic-label class="grey border-grey" v-if="origin.addr != null && origin.addr.startsWith('https://') && origin.http2Enabled">HTTP/2</tiny-basic-label>
	
					<span v-if="origin.domains != null && origin.domains.length > 0"><tiny-basic-label class="grey border-grey" v-for="domain in origin.domains">匹配: {{domain}}</tiny-basic-label></span>
					<span v-else-if="hasMatchedDomains"><tiny-basic-label class="grey border-grey">匹配: 所有域名</tiny-basic-label></span>
				</div>
			</td>
			<td :class="{disabled:!origin.isOn}">{{origin.weight}}</td>
			<td>
				<label-on :v-is-on="origin.isOn"></label-on>
			</td>
			<td>
				<a href="" @click.prevent="updateOrigin(origin.id)">修改</a> &nbsp;
				<a href="" v-if="origin.isOn" @click.prevent="updateOriginIsOn(origin.id, origin.addr, false)">停用</a><a href=""  v-if="!origin.isOn" @click.prevent="updateOriginIsOn(origin.id, origin.addr, true)"><span class="red">启用</span></a> &nbsp;
				<a href="" @click.prevent="deleteOrigin(origin.id, origin.addr)">删除</a>
			</td>
		</tr>
	</tbody>
</table>`
})

Vue.component("prior-checkbox", {
	props: ["v-config"],
	data: function () {
		return {
			isPrior: this.vConfig.isPrior
		}
	},
	watch: {
		isPrior: function (v) {
			this.vConfig.isPrior = v
		}
	},
	template: `<tbody>
	<tr :class="{active:isPrior}">
		<td class="title">打开独立配置</td>
		<td>
			<div class="ui toggle checkbox">
				<input type="checkbox" v-model="isPrior"/>
				<label class="red"></label>
			</div>
			<p class="comment"><strong v-if="isPrior">[已打开]</strong> 打开后可以覆盖父级或子级配置。</p>
		</td>
	</tr>
</tbody>`
})

Vue.component("user-agent-config-box", {
	props: ["v-is-location", "v-is-group", "value"],
	data: function () {
		let config = this.value
		if (config == null) {
			config = {
				isPrior: false,
				isOn: false,
				filters: []
			}
		}
		if (config.filters == null) {
			config.filters = []
		}
		return {
			config: config,
			isAdding: false,
			addingFilter: {
				keywords: [],
				action: "deny"
			},
			moreOptionsVisible: false,
			batchKeywords: ""
		}
	},
	methods: {
		isOn: function () {
			return ((!this.vIsLocation && !this.vIsGroup) || this.config.isPrior) && this.config.isOn
		},
		remove: function (index) {
			let that = this
			teaweb.confirm("确定要删除此名单吗？", function () {
				that.config.filters.$remove(index)
			})
		},
		add: function () {
			this.isAdding = true
			let that = this
			setTimeout(function () {
				that.$refs.batchKeywords.focus()
			})
		},
		confirm: function () {
			if (this.addingFilter.action == "deny") {
				this.config.filters.push(this.addingFilter)
			} else {
				let index = -1
				this.config.filters.forEach(function (filter, filterIndex) {
					if (filter.action == "allow") {
						index = filterIndex
					}
				})

				if (index < 0) {
					this.config.filters.unshift(this.addingFilter)
				} else {
					this.config.filters.$insert(index + 1, this.addingFilter)
				}
			}

			this.cancel()
		},
		cancel: function () {
			this.isAdding = false
			this.addingFilter = {
				keywords: [],
				action: "deny"
			}
			this.batchKeywords = ""
		},
		changeKeywords: function (keywords) {
			let arr = keywords.split(/\n/)
			let resultKeywords = []
			arr.forEach(function (keyword){
				keyword = keyword.trim()
				if (!resultKeywords.$contains(keyword)) {
					resultKeywords.push(keyword)
				}
			})
			this.addingFilter.keywords = resultKeywords
		},
		showMoreOptions: function () {
			this.moreOptionsVisible = !this.moreOptionsVisible
		}
	},
	template: `<div>
	<input type="hidden" name="userAgentJSON" :value="JSON.stringify(config)"/>
	<table class="ui table definition selectable">
		<prior-checkbox :v-config="config" v-if="vIsLocation || vIsGroup"></prior-checkbox>
		<tbody v-show="(!vIsLocation && !vIsGroup) || config.isPrior">
			<tr>
				<td class="title">启用UA名单</td>
				<td>
					<div class="ui checkbox">
						<input type="checkbox" value="1" v-model="config.isOn"/>
						<label></label>
					</div>
					<p class="comment">选中后表示开启UserAgent名单。</p>
				</td>
			</tr>
		</tbody>
		<tbody v-show="isOn()">
			<tr>
				<td>UA名单</td>
				<td>
					<div v-if="config.filters.length > 0">
						<table class="ui table celled">
							<thead class="full-width">
								<tr>
									<th>UA关键词</th>
									<th class="two wide">动作</th>
									<th class="one op">操作</th>
								</tr>
							</thead>
							<tbody v-for="(filter, index) in config.filters">
								<tr>
									<td style="background: white">
										<span v-for="keyword in filter.keywords" class="ui label basic tiny">
											<span v-if="keyword.length > 0">{{keyword}}</span>
											<span v-if="keyword.length == 0" class="disabled">[空]</span>
										</span>
									</td>
									<td>
										<span v-if="filter.action == 'allow'" class="green">允许</span><span v-if="filter.action == 'deny'" class="red">不允许</span>
									</td>
									<td><a href="" @click.prevent="remove(index)">删除</a></td>
								</tr>
							</tbody>
						</table>
					</div>
					<div v-if="isAdding" style="margin-top: 0.5em">
						<table class="ui table definition">
							<tr>
								<td class="title">UA关键词</td>
								<td>
									<textarea v-model="batchKeywords" @input="changeKeywords(batchKeywords)" ref="batchKeywords" style="width: 20em" placeholder="*浏览器标识*"></textarea>
									<p class="comment">每行一个关键词；不区分大小写，比如<code-label>Chrome</code-label>；支持<code-label>*</code-label>通配符，比如<code-label>*Firefox*</code-label>；也支持空行的关键词，表示空UserAgent。</p>
								</td>
							</tr>
							<tr>
								<td>动作</td>
								<td><select class="ui dropdown auto-width" v-model="addingFilter.action">
										<option value="deny">不允许</option>
										<option value="allow">允许</option>
									</select>
								</td>
							</tr>
						</table>
						<button type="button" class="ui button tiny" @click.prevent="confirm">保存</button> &nbsp; <a href="" @click.prevent="cancel" title="取消"><i class="icon remove small"></i></a>
					</div>
					<div v-show="!isAdding" style="margin-top: 0.5em">
						<button class="ui button tiny" type="button" @click.prevent="add">+</button>
					</div>
				</td>
			</tr>
			<tr>
				<td colspan="2"><more-options-indicator @change="showMoreOptions"></more-options-indicator></td>
			</tr>
		</tbody>
		<tbody v-show="moreOptionsVisible && isOn()">
			<tr>
				<td>例外URL</td>
				<td>
					<url-patterns-box v-model="config.exceptURLPatterns"></url-patterns-box>
					<p class="comment">如果填写了例外URL，表示这些URL跳过不做处理。</p>
				</td>
			</tr>
			<tr>
				<td>限制URL</td>
				<td>
					<url-patterns-box v-model="config.onlyURLPatterns"></url-patterns-box>
					<p class="comment">如果填写了限制URL，表示只对这些URL进行处理；如果不填则表示支持所有的URL。</p>
				</td>
			</tr>
		</tbody>
	</table>
	<div class="margin"></div>
</div>`
})

Vue.component("http-firewall-province-selector", {
	props: ["v-type", "v-provinces"],
	data: function () {
		let provinces = this.vProvinces
		if (provinces == null) {
			provinces = []
		}

		return {
			listType: this.vType,
			provinces: provinces
		}
	},
	methods: {
		addProvince: function () {
			let selectedProvinceIds = this.provinces.map(function (province) {
				return province.id
			})
			let that = this
			teaweb.popup("/servers/server/settings/waf/ipadmin/selectProvincesPopup?type=" + this.listType + "&selectedProvinceIds=" + selectedProvinceIds.join(","), {
				width: "50em",
				height: "26em",
				callback: function (resp) {
					that.provinces = resp.data.selectedProvinces
					that.$forceUpdate()
					that.notifyChange()
				}
			})
		},
		removeProvince: function (index) {
			this.provinces.$remove(index)
			this.notifyChange()
		},
		resetProvinces: function () {
			this.provinces = []
			this.notifyChange()
		},
		notifyChange: function () {
			this.$emit("change", {
				"provinces": this.provinces
			})
		}
	},
	template: `<div>
	<span v-if="provinces.length == 0" class="disabled">暂时没有选择<span v-if="listType =='allow'">允许</span><span v-else>封禁</span>的省份。</span>
	<div v-show="provinces.length > 0">
		<div class="ui label tiny basic" v-for="(province, index) in provinces" style="margin-bottom: 0.5em">
			<input type="hidden" :name="listType + 'ProvinceIds'" :value="province.id"/>
			{{province.name}} <a href="" @click.prevent="removeProvince(index)" title="删除"><i class="icon remove"></i></a>
		</div>
	</div>
	<div class="ui divider"></div>
	<button type="button" class="ui button tiny" @click.prevent="addProvince">修改</button> &nbsp; <button type="button" class="ui button tiny" v-show="provinces.length > 0" @click.prevent="resetProvinces">清空</button>
</div>`
})

Vue.component("http-firewall-provider-selector", {
	props: ["v-type", "v-providers"],
	data: function () {
		let providers = this.vProviders
		if (providers == null) {
			providers = []
		}

		return {
			listType: this.vType,
			providers: providers
		}
	},
	methods: {
		addProvider: function () {
			let selectedProviderIds = this.providers.map(function (provider) {
				return provider.id
			})
			let that = this
			teaweb.popup("/servers/server/settings/waf/ipadmin/selectProvidersPopup?type=" + this.listType + "&selectedProviderIds=" + selectedProviderIds.join(","), {
				width: "50em",
				height: "26em",
				callback: function (resp) {
					that.providers = resp.data.selectedProviders
					that.$forceUpdate()
					that.notifyChange()
				}
			})
		},
		removeProvider: function (index) {
			this.providers.$remove(index)
			this.notifyChange()
		},
		resetProviders: function () {
			this.providers = []
			this.notifyChange()
		},
		notifyChange: function () {
			this.$emit("change", {
				"providers": this.providers
			})
		}
	},
	template: `<div>
	<span v-if="providers.length == 0" class="disabled">暂时没有选择<span v-if="listType =='allow'">允许</span><span v-else>封禁</span>的运营商。</span>
	<div v-show="providers.length > 0">
		<div class="ui label tiny basic" v-for="(provider, index) in providers" style="margin-bottom: 0.5em">
			<input type="hidden" :name="listType + 'ProviderIds'" :value="provider.id"/>
			{{provider.name}} <a href="" @click.prevent="removeProvider(index)" title="删除"><i class="icon remove"></i></a>
		</div>
	</div>
	<div class="ui divider"></div>
	<button type="button" class="ui button tiny" @click.prevent="addProvider">修改</button> &nbsp; <button type="button" class="ui button tiny" v-show="providers.length > 0" @click.prevent="resetProviders">清空</button>
</div>`
})

Vue.component("server-group-selector", {
	props: ["v-groups"],
	data: function () {
		let groups = this.vGroups
		if (groups == null) {
			groups = []
		}
		return {
			groups: groups
		}
	},
	methods: {
		selectGroup: function () {
			let that = this
			let groupIds = this.groups.map(function (v) {
				return v.id.toString()
			}).join(",")
			teaweb.popup("/servers/groups/selectPopup?selectedGroupIds=" + groupIds, {
				callback: function (resp) {
					that.groups.push(resp.data.group)
				}
			})
		},
		addGroup: function () {
			let that = this
			teaweb.popup("/servers/groups/createPopup", {
				callback: function (resp) {
					that.groups.push(resp.data.group)
				}
			})
		},
		removeGroup: function (index) {
			this.groups.$remove(index)
		},
		groupIds: function () {
			return this.groups.map(function (v) {
				return v.id
			})
		}
	},
	template: `<div>
	<div v-if="groups.length > 0">
		<div class="ui label small basic" v-if="groups.length > 0" v-for="(group, index) in groups">
			<input type="hidden" name="groupIds" :value="group.id"/>
			{{group.name}} &nbsp;<a href="" title="删除" @click.prevent="removeGroup(index)"><i class="icon remove"></i></a>
		</div>
		<div class="ui divider"></div>
	</div>
	<div>
		<a href="" @click.prevent="selectGroup()">[选择分组]</a> &nbsp; <a href="" @click.prevent="addGroup()">[添加分组]</a>
	</div>
</div>`
})

// URL扩展名条件
Vue.component("http-cond-url-extension", {
	props: ["v-cond"],
	data: function () {
		let cond = {
			isRequest: true,
			param: "${requestPathLowerExtension}",
			operator: "in",
			value: "[]"
		}
		if (this.vCond != null && this.vCond.param == cond.param) {
			cond.value = this.vCond.value
		}

		let extensions = []
		try {
			extensions = JSON.parse(cond.value)
		} catch (e) {

		}

		return {
			cond: cond,
			extensions: extensions, // TODO 可以拖动排序

			isAdding: false,
			addingExt: ""
		}
	},
	watch: {
		extensions: function () {
			this.cond.value = JSON.stringify(this.extensions)
		}
	},
	methods: {
		addExt: function () {
			this.isAdding = !this.isAdding

			if (this.isAdding) {
				let that = this
				setTimeout(function () {
					that.$refs.addingExt.focus()
				}, 100)
			}
		},
		cancelAdding: function () {
			this.isAdding = false
			this.addingExt = ""
		},
		confirmAdding: function () {
			// TODO 做更详细的校验
			// TODO 如果有重复的则提示之

			if (this.addingExt.length == 0) {
				return
			}

			let that = this
			this.addingExt.split(/[,;，；|]/).forEach(function (ext) {
				ext = ext.trim()
				if (ext.length > 0) {
					if (ext[0] != ".") {
						ext = "." + ext
					}
					ext = ext.replace(/\s+/g, "").toLowerCase()
					that.extensions.push(ext)
				}
			})

			// 清除状态
			this.cancelAdding()
		},
		removeExt: function (index) {
			this.extensions.$remove(index)
		}
	},
	template: `<div>
	<input type="hidden" name="condJSON" :value="JSON.stringify(cond)"/>
	<div v-if="extensions.length > 0">
		<div class="ui label small basic" v-for="(ext, index) in extensions">{{ext}} <a href="" title="删除" @click.prevent="removeExt(index)"><i class="icon remove small"></i></a></div>
		<div class="ui divider"></div>
	</div>
	<div class="ui fields inline" v-if="isAdding">
		<div class="ui field">
			<input type="text" size="20" maxlength="100" v-model="addingExt" ref="addingExt" placeholder=".xxx, .yyy" @keyup.enter="confirmAdding" @keypress.enter.prevent="1" />
		</div>
		<div class="ui field">
			<button class="ui button tiny basic" type="button" @click.prevent="confirmAdding">确认</button>
			<a href="" title="取消" @click.prevent="cancelAdding"><i class="icon remove"></i></a>
		</div> 
	</div>
	<div style="margin-top: 1em" v-show="!isAdding">
		<button class="ui button tiny basic" type="button" @click.prevent="addExt()">+添加扩展名</button>
	</div>
	<p class="comment">扩展名需要包含点（.）符号，例如<code-label>.jpg</code-label>、<code-label>.png</code-label>之类；多个扩展名用逗号分割。</p>
</div>`
})

// 排除URL扩展名条件
Vue.component("http-cond-url-not-extension", {
	props: ["v-cond"],
	data: function () {
		let cond = {
			isRequest: true,
			param: "${requestPathLowerExtension}",
			operator: "not in",
			value: "[]"
		}
		if (this.vCond != null && this.vCond.param == cond.param) {
			cond.value = this.vCond.value
		}

		let extensions = []
		try {
			extensions = JSON.parse(cond.value)
		} catch (e) {

		}

		return {
			cond: cond,
			extensions: extensions, // TODO 可以拖动排序

			isAdding: false,
			addingExt: ""
		}
	},
	watch: {
		extensions: function () {
			this.cond.value = JSON.stringify(this.extensions)
		}
	},
	methods: {
		addExt: function () {
			this.isAdding = !this.isAdding

			if (this.isAdding) {
				let that = this
				setTimeout(function () {
					that.$refs.addingExt.focus()
				}, 100)
			}
		},
		cancelAdding: function () {
			this.isAdding = false
			this.addingExt = ""
		},
		confirmAdding: function () {
			// TODO 做更详细的校验
			// TODO 如果有重复的则提示之

			if (this.addingExt.length == 0) {
				return
			}
			if (this.addingExt[0] != ".") {
				this.addingExt = "." + this.addingExt
			}
			this.addingExt = this.addingExt.replace(/\s+/g, "").toLowerCase()
			this.extensions.push(this.addingExt)

			// 清除状态
			this.cancelAdding()
		},
		removeExt: function (index) {
			this.extensions.$remove(index)
		}
	},
	template: `<div>
	<input type="hidden" name="condJSON" :value="JSON.stringify(cond)"/>
	<div v-if="extensions.length > 0">
		<div class="ui label small basic" v-for="(ext, index) in extensions">{{ext}} <a href="" title="删除" @click.prevent="removeExt(index)"><i class="icon remove"></i></a></div>
		<div class="ui divider"></div>
	</div>
	<div class="ui fields inline" v-if="isAdding">
		<div class="ui field">
			<input type="text" size="6" maxlength="100" v-model="addingExt" ref="addingExt" placeholder=".xxx" @keyup.enter="confirmAdding" @keypress.enter.prevent="1" />
		</div>
		<div class="ui field">
			<button class="ui button tiny basic" type="button" @click.prevent="confirmAdding">确认</button>
			<a href="" title="取消" @click.prevent="cancelAdding"><i class="icon remove"></i></a>
		</div> 
	</div>
	<div style="margin-top: 1em" v-show="!isAdding">
		<button class="ui button tiny basic" type="button" @click.prevent="addExt()">+添加扩展名</button>
	</div>
	<p class="comment">扩展名需要包含点（.）符号，例如<code-label>.jpg</code-label>、<code-label>.png</code-label>之类。</p>
</div>`
})

// 根据URL前缀
Vue.component("http-cond-url-prefix", {
	props: ["v-cond"],
	mounted: function () {
		this.$refs.valueInput.focus()
	},
	data: function () {
		let cond = {
			isRequest: true,
			param: "${requestPath}",
			operator: "prefix",
			value: "",
			isCaseInsensitive: false
		}
		if (this.vCond != null && typeof (this.vCond.value) == "string") {
			cond.value = this.vCond.value
		}
		return {
			cond: cond
		}
	},
	methods: {
		changeCaseInsensitive: function (isCaseInsensitive) {
			this.cond.isCaseInsensitive = isCaseInsensitive
		}
	},
	template: `<div>
	<input type="hidden" name="condJSON" :value="JSON.stringify(cond)"/>
	<input type="text" v-model="cond.value" ref="valueInput"/>
	<p class="comment">URL前缀，有此前缀的URL都将会被匹配，通常以<code-label>/</code-label>开头，比如<code-label>/static</code-label>、<code-label>/images</code-label>，不需要带域名。</p>
</div>`
})

Vue.component("http-cond-url-not-prefix", {
	props: ["v-cond"],
	mounted: function () {
		this.$refs.valueInput.focus()
	},
	data: function () {
		let cond = {
			isRequest: true,
			param: "${requestPath}",
			operator: "prefix",
			value: "",
			isReverse: true,
			isCaseInsensitive: false
		}
		if (this.vCond != null && typeof this.vCond.value == "string") {
			cond.value = this.vCond.value
		}
		return {
			cond: cond
		}
	},
	methods: {
		changeCaseInsensitive: function (isCaseInsensitive) {
			this.cond.isCaseInsensitive = isCaseInsensitive
		}
	},
	template: `<div>
	<input type="hidden" name="condJSON" :value="JSON.stringify(cond)"/>
	<input type="text" v-model="cond.value" ref="valueInput"/>
	<p class="comment">要排除的URL前缀，有此前缀的URL都将会被匹配，通常以<code-label>/</code-label>开头，比如<code-label>/static</code-label>、<code-label>/images</code-label>，不需要带域名。</p>
</div>`
})

// 首页
Vue.component("http-cond-url-eq-index", {
	props: ["v-cond"],
	data: function () {
		let cond = {
			isRequest: true,
			param: "${requestPath}",
			operator: "eq",
			value: "/",
			isCaseInsensitive: false
		}
		if (this.vCond != null && typeof this.vCond.value == "string") {
			cond.value = this.vCond.value
		}
		return {
			cond: cond
		}
	},
	methods: {
		changeCaseInsensitive: function (isCaseInsensitive) {
			this.cond.isCaseInsensitive = isCaseInsensitive
		}
	},
	template: `<div>
	<input type="hidden" name="condJSON" :value="JSON.stringify(cond)"/>
	<input type="text" v-model="cond.value" disabled="disabled" style="background: #eee"/>
	<p class="comment">检查URL路径是为<code-label>/</code-label>，不需要带域名。</p>
</div>`
})

// 全站
Vue.component("http-cond-url-all", {
	props: ["v-cond"],
	data: function () {
		let cond = {
			isRequest: true,
			param: "${requestPath}",
			operator: "prefix",
			value: "/",
			isCaseInsensitive: false
		}
		if (this.vCond != null && typeof this.vCond.value == "string") {
			cond.value = this.vCond.value
		}
		return {
			cond: cond
		}
	},
	methods: {
		changeCaseInsensitive: function (isCaseInsensitive) {
			this.cond.isCaseInsensitive = isCaseInsensitive
		}
	},
	template: `<div>
	<input type="hidden" name="condJSON" :value="JSON.stringify(cond)"/>
	<input type="text" v-model="cond.value" disabled="disabled" style="background: #eee"/>
	<p class="comment">支持全站所有URL。</p>
</div>`
})

// URL精准匹配
Vue.component("http-cond-url-eq", {
	props: ["v-cond"],
	mounted: function () {
		this.$refs.valueInput.focus()
	},
	data: function () {
		let cond = {
			isRequest: true,
			param: "${requestPath}",
			operator: "eq",
			value: "",
			isCaseInsensitive: false
		}
		if (this.vCond != null && typeof this.vCond.value == "string") {
			cond.value = this.vCond.value
		}
		return {
			cond: cond
		}
	},
	methods: {
		changeCaseInsensitive: function (isCaseInsensitive) {
			this.cond.isCaseInsensitive = isCaseInsensitive
		}
	},
	template: `<div>
	<input type="hidden" name="condJSON" :value="JSON.stringify(cond)"/>
	<input type="text" v-model="cond.value" ref="valueInput"/>
	<p class="comment">完整的URL路径，通常以<code-label>/</code-label>开头，比如<code-label>/static/ui.js</code-label>，不需要带域名。</p>
</div>`
})

Vue.component("http-cond-url-not-eq", {
	props: ["v-cond"],
	mounted: function () {
		this.$refs.valueInput.focus()
	},
	data: function () {
		let cond = {
			isRequest: true,
			param: "${requestPath}",
			operator: "eq",
			value: "",
			isReverse: true,
			isCaseInsensitive: false
		}
		if (this.vCond != null && typeof this.vCond.value == "string") {
			cond.value = this.vCond.value
		}
		return {
			cond: cond
		}
	},
	methods: {
		changeCaseInsensitive: function (isCaseInsensitive) {
			this.cond.isCaseInsensitive = isCaseInsensitive
		}
	},
	template: `<div>
	<input type="hidden" name="condJSON" :value="JSON.stringify(cond)"/>
	<input type="text" v-model="cond.value" ref="valueInput"/>
	<p class="comment">要排除的完整的URL路径，通常以<code-label>/</code-label>开头，比如<code-label>/static/ui.js</code-label>，不需要带域名。</p>
</div>`
})

// URL正则匹配
Vue.component("http-cond-url-regexp", {
	props: ["v-cond"],
	mounted: function () {
		this.$refs.valueInput.focus()
	},
	data: function () {
		let cond = {
			isRequest: true,
			param: "${requestPath}",
			operator: "regexp",
			value: "",
			isCaseInsensitive: false
		}
		if (this.vCond != null && typeof this.vCond.value == "string") {
			cond.value = this.vCond.value
		}
		return {
			cond: cond
		}
	},
	methods: {
		changeCaseInsensitive: function (isCaseInsensitive) {
			this.cond.isCaseInsensitive = isCaseInsensitive
		}
	},
	template: `<div>
	<input type="hidden" name="condJSON" :value="JSON.stringify(cond)"/>
	<input type="text" v-model="cond.value" ref="valueInput"/>
	<p class="comment">匹配URL的正则表达式，比如<code-label>^/static/(.*).js$</code-label>，不需要带域名。</p>
</div>`
})

// 排除URL正则匹配
Vue.component("http-cond-url-not-regexp", {
	props: ["v-cond"],
	mounted: function () {
		this.$refs.valueInput.focus()
	},
	data: function () {
		let cond = {
			isRequest: true,
			param: "${requestPath}",
			operator: "not regexp",
			value: "",
			isCaseInsensitive: false
		}
		if (this.vCond != null && typeof this.vCond.value == "string") {
			cond.value = this.vCond.value
		}
		return {
			cond: cond
		}
	},
	methods: {
		changeCaseInsensitive: function (isCaseInsensitive) {
			this.cond.isCaseInsensitive = isCaseInsensitive
		}
	},
	template: `<div>
	<input type="hidden" name="condJSON" :value="JSON.stringify(cond)"/>
	<input type="text" v-model="cond.value" ref="valueInput"/>
	<p class="comment"><strong>不要</strong>匹配URL的正则表达式，意即只要匹配成功则排除此条件，比如<code-label>^/static/(.*).js$</code-label>，不需要带域名。</p>
</div>`
})

// URL通配符
Vue.component("http-cond-url-wildcard-match", {
	props: ["v-cond"],
	mounted: function () {
		this.$refs.valueInput.focus()
	},
	data: function () {
		let cond = {
			isRequest: true,
			param: "${requestPath}",
			operator: "wildcard match",
			value: "",
			isCaseInsensitive: false
		}
		if (this.vCond != null && typeof this.vCond.value == "string") {
			cond.value = this.vCond.value
		}
		return {
			cond: cond
		}
	},
	methods: {
		changeCaseInsensitive: function (isCaseInsensitive) {
			this.cond.isCaseInsensitive = isCaseInsensitive
		}
	},
	template: `<div>
	<input type="hidden" name="condJSON" :value="JSON.stringify(cond)"/>
	<input type="text" v-model="cond.value" ref="valueInput"/>
	<p class="comment">匹配URL的通配符，用星号（<code-label>*</code-label>）表示任意字符，比如（<code-label>/images/*.png</code-label>、<code-label>/static/*</code-label>，不需要带域名。</p>
</div>`
})

// User-Agent正则匹配
Vue.component("http-cond-user-agent-regexp", {
	props: ["v-cond"],
	mounted: function () {
		this.$refs.valueInput.focus()
	},
	data: function () {
		let cond = {
			isRequest: true,
			param: "${userAgent}",
			operator: "regexp",
			value: "",
			isCaseInsensitive: false
		}
		if (this.vCond != null && typeof this.vCond.value == "string") {
			cond.value = this.vCond.value
		}
		return {
			cond: cond
		}
	},
	methods: {
		changeCaseInsensitive: function (isCaseInsensitive) {
			this.cond.isCaseInsensitive = isCaseInsensitive
		}
	},
	template: `<div>
	<input type="hidden" name="condJSON" :value="JSON.stringify(cond)"/>
	<input type="text" v-model="cond.value" ref="valueInput"/>
	<p class="comment">匹配User-Agent的正则表达式，比如<code-label>Android|iPhone</code-label>。</p>
</div>`
})

// User-Agent正则不匹配
Vue.component("http-cond-user-agent-not-regexp", {
	props: ["v-cond"],
	mounted: function () {
		this.$refs.valueInput.focus()
	},
	data: function () {
		let cond = {
			isRequest: true,
			param: "${userAgent}",
			operator: "not regexp",
			value: "",
			isCaseInsensitive: false
		}
		if (this.vCond != null && typeof this.vCond.value == "string") {
			cond.value = this.vCond.value
		}
		return {
			cond: cond
		}
	},
	methods: {
		changeCaseInsensitive: function (isCaseInsensitive) {
			this.cond.isCaseInsensitive = isCaseInsensitive
		}
	},
	template: `<div>
	<input type="hidden" name="condJSON" :value="JSON.stringify(cond)"/>
	<input type="text" v-model="cond.value" ref="valueInput"/>
	<p class="comment">匹配User-Agent的正则表达式，比如<code-label>Android|iPhone</code-label>，如果匹配，则排除此条件。</p>
</div>`
})

// 根据MimeType
Vue.component("http-cond-mime-type", {
	props: ["v-cond"],
	data: function () {
		let cond = {
			isRequest: false,
			param: "${response.contentType}",
			operator: "mime type",
			value: "[]"
		}
		if (this.vCond != null && this.vCond.param == cond.param) {
			cond.value = this.vCond.value
		}
		return {
			cond: cond,
			mimeTypes: JSON.parse(cond.value), // TODO 可以拖动排序

			isAdding: false,
			addingMimeType: ""
		}
	},
	watch: {
		mimeTypes: function () {
			this.cond.value = JSON.stringify(this.mimeTypes)
		}
	},
	methods: {
		addMimeType: function () {
			this.isAdding = !this.isAdding

			if (this.isAdding) {
				let that = this
				setTimeout(function () {
					that.$refs.addingMimeType.focus()
				}, 100)
			}
		},
		cancelAdding: function () {
			this.isAdding = false
			this.addingMimeType = ""
		},
		confirmAdding: function () {
			// TODO 做更详细的校验
			// TODO 如果有重复的则提示之

			if (this.addingMimeType.length == 0) {
				return
			}
			this.addingMimeType = this.addingMimeType.replace(/\s+/g, "")
			this.mimeTypes.push(this.addingMimeType)

			// 清除状态
			this.cancelAdding()
		},
		removeMimeType: function (index) {
			this.mimeTypes.$remove(index)
		}
	},
	template: `<div>
	<input type="hidden" name="condJSON" :value="JSON.stringify(cond)"/>
	<div v-if="mimeTypes.length > 0">
		<div class="ui label small" v-for="(mimeType, index) in mimeTypes">{{mimeType}} <a href="" title="删除" @click.prevent="removeMimeType(index)"><i class="icon remove"></i></a></div>
		<div class="ui divider"></div>
	</div>
	<div class="ui fields inline" v-if="isAdding">
		<div class="ui field">
			<input type="text" size="16" maxlength="100" v-model="addingMimeType" ref="addingMimeType" placeholder="类似于image/png" @keyup.enter="confirmAdding" @keypress.enter.prevent="1" />
		</div>
		<div class="ui field">
			<button class="ui button tiny basic" type="button" @click.prevent="confirmAdding">确认</button>
			<a href="" title="取消" @click.prevent="cancelAdding"><i class="icon remove"></i></a>
		</div> 
	</div>
	<div style="margin-top: 1em">
		<button class="ui button tiny basic" type="button" @click.prevent="addMimeType()">+添加MimeType</button>
	</div>
	<p class="comment">服务器返回的内容的MimeType，比如<span class="ui label tiny">text/html</span>、<span class="ui label tiny">image/*</span>等。</p>
</div>`
})

// 参数匹配
Vue.component("http-cond-params", {
	props: ["v-cond"],
	mounted: function () {
		let cond = this.vCond
		if (cond == null) {
			return
		}
		this.operator = cond.operator

		// stringValue
		if (["regexp", "not regexp", "eq", "not", "prefix", "suffix", "contains", "not contains", "eq ip", "gt ip", "gte ip", "lt ip", "lte ip", "ip range"].$contains(cond.operator)) {
			this.stringValue = cond.value
			return
		}

		// numberValue
		if (["eq int", "eq float", "gt", "gte", "lt", "lte", "mod 10", "ip mod 10", "mod 100", "ip mod 100"].$contains(cond.operator)) {
			this.numberValue = cond.value
			return
		}

		// modValue
		if (["mod", "ip mod"].$contains(cond.operator)) {
			let pieces = cond.value.split(",")
			this.modDivValue = pieces[0]
			if (pieces.length > 1) {
				this.modRemValue = pieces[1]
			}
			return
		}

		// stringValues
		let that = this
		if (["in", "not in", "file ext", "mime type"].$contains(cond.operator)) {
			try {
				let arr = JSON.parse(cond.value)
				if (arr != null && (arr instanceof Array)) {
					arr.forEach(function (v) {
						that.stringValues.push(v)
					})
				}
			} catch (e) {

			}
			return
		}

		// versionValue
		if (["version range"].$contains(cond.operator)) {
			let pieces = cond.value.split(",")
			this.versionRangeMinValue = pieces[0]
			if (pieces.length > 1) {
				this.versionRangeMaxValue = pieces[1]
			}
			return
		}
	},
	data: function () {
		let cond = {
			isRequest: true,
			param: "",
			operator: window.REQUEST_COND_OPERATORS[0].op,
			value: "",
			isCaseInsensitive: false
		}
		if (this.vCond != null) {
			cond = this.vCond
		}
		return {
			cond: cond,
			operators: window.REQUEST_COND_OPERATORS,
			operator: window.REQUEST_COND_OPERATORS[0].op,
			operatorDescription: window.REQUEST_COND_OPERATORS[0].description,
			variables: window.REQUEST_VARIABLES,
			variable: "",

			// 各种类型的值
			stringValue: "",
			numberValue: "",

			modDivValue: "",
			modRemValue: "",

			stringValues: [],

			versionRangeMinValue: "",
			versionRangeMaxValue: ""
		}
	},
	methods: {
		changeVariable: function () {
			let v = this.cond.param
			if (v == null) {
				v = ""
			}
			this.cond.param = v + this.variable
		},
		changeOperator: function () {
			let that = this
			this.operators.forEach(function (v) {
				if (v.op == that.operator) {
					that.operatorDescription = v.description
				}
			})

			this.cond.operator = this.operator

			// 移动光标
			let box = document.getElementById("variables-value-box")
			if (box != null) {
				setTimeout(function () {
					let input = box.getElementsByTagName("INPUT")
					if (input.length > 0) {
						input[0].focus()
					}
				}, 100)
			}
		},
		changeStringValues: function (v) {
			this.stringValues = v
			this.cond.value = JSON.stringify(v)
		}
	},
	watch: {
		stringValue: function (v) {
			this.cond.value = v
		},
		numberValue: function (v) {
			// TODO 校验数字
			this.cond.value = v
		},
		modDivValue: function (v) {
			if (v.length == 0) {
				return
			}
			let div = parseInt(v)
			if (isNaN(div)) {
				div = 1
			}
			this.modDivValue = div
			this.cond.value = div + "," + this.modRemValue
		},
		modRemValue: function (v) {
			if (v.length == 0) {
				return
			}
			let rem = parseInt(v)
			if (isNaN(rem)) {
				rem = 0
			}
			this.modRemValue = rem
			this.cond.value = this.modDivValue + "," + rem
		},
		versionRangeMinValue: function (v) {
			this.cond.value = this.versionRangeMinValue + "," + this.versionRangeMaxValue
		},
		versionRangeMaxValue: function (v) {
			this.cond.value = this.versionRangeMinValue + "," + this.versionRangeMaxValue
		}
	},
	template: `<tbody>
	<tr>
		<td style="width: 8em">参数值</td>
		<td>
			<input type="hidden" name="condJSON" :value="JSON.stringify(cond)"/>
			<div>
				<div class="ui field">
					<input type="text" placeholder="\${xxx}" v-model="cond.param"/>
				</div>
				<div class="ui field">
					<select class="ui dropdown" style="width: 16em; color: grey" v-model="variable" @change="changeVariable">
						<option value="">[常用参数]</option>
						<option v-for="v in variables" :value="v.code">{{v.code}} - {{v.name}}</option>
					</select>
				</div>
			</div>
			<p class="comment">其中可以使用变量，类似于<code-label>\${requestPath}</code-label>，也可以是多个变量的组合。</p>
		</td>
	</tr>
	<tr>
		<td>操作符</td>
		<td>
			<div>
				<select class="ui dropdown auto-width" v-model="operator" @change="changeOperator">
					<option v-for="operator in operators" :value="operator.op">{{operator.name}}</option>
				</select>
				<p class="comment" v-html="operatorDescription"></p>
			</div>
		</td>
	</tr>
	<tr v-show="!['file exist', 'file not exist'].$contains(cond.operator)">
		<td>对比值</td>
		<td id="variables-value-box">
			<!-- 正则表达式 -->
			<div v-if="['regexp', 'not regexp'].$contains(cond.operator)">
				<input type="text" v-model="stringValue"/>
				<p class="comment">要匹配的正则表达式，比如<code-label>^/static/(.+).js</code-label>。</p>
			</div>
			
			<!-- 数字相关 -->
			<div v-if="['eq int', 'eq float', 'gt', 'gte', 'lt', 'lte'].$contains(cond.operator)">
				<input type="text" maxlength="11" size="11" style="width: 5em" v-model="numberValue"/>
				<p class="comment">要对比的数字。</p>
			</div>
			
			<!-- 取模 -->
			<div v-if="['mod 10'].$contains(cond.operator)">
				<input type="text" maxlength="11" size="11" style="width: 5em" v-model="numberValue"/>
				<p class="comment">参数值除以10的余数，在0-9之间。</p>
			</div>
			<div v-if="['mod 100'].$contains(cond.operator)">
				<input type="text" maxlength="11" size="11" style="width: 5em" v-model="numberValue"/>
				<p class="comment">参数值除以100的余数，在0-99之间。</p>
			</div>
			<div v-if="['mod', 'ip mod'].$contains(cond.operator)">
				<div class="ui fields inline">
					<div class="ui field">除：</div>
					<div class="ui field">
						<input type="text" maxlength="11" size="11" style="width: 5em" v-model="modDivValue" placeholder="除数"/>
					</div>
					<div class="ui field">余：</div>
					<div class="ui field">
						<input type="text" maxlength="11" size="11" style="width: 5em" v-model="modRemValue" placeholder="余数"/>
					</div>
				</div>
			</div>
			
			<!-- 字符串相关 -->
			<div v-if="['eq', 'not', 'prefix', 'suffix', 'contains', 'not contains'].$contains(cond.operator)">
				<input type="text" v-model="stringValue"/>
				<p class="comment" v-if="cond.operator == 'eq'">和参数值一致的字符串。</p>
				<p class="comment" v-if="cond.operator == 'not'">和参数值不一致的字符串。</p>
				<p class="comment" v-if="cond.operator == 'prefix'">参数值的前缀。</p>
				<p class="comment" v-if="cond.operator == 'suffix'">参数值的后缀为此字符串。</p>
				<p class="comment" v-if="cond.operator == 'contains'">参数值包含此字符串。</p>
				<p class="comment" v-if="cond.operator == 'not contains'">参数值不包含此字符串。</p>
			</div>
			<div v-if="['in', 'not in', 'file ext', 'mime type'].$contains(cond.operator)">
				<values-box @change="changeStringValues" :values="stringValues" size="15"></values-box>
				<p class="comment" v-if="cond.operator == 'in'">添加参数值列表。</p>
				<p class="comment" v-if="cond.operator == 'not in'">添加参数值列表。</p>
				<p class="comment" v-if="cond.operator == 'file ext'">添加扩展名列表，比如<code-label>png</code-label>、<code-label>html</code-label>，不包括点。</p>
				<p class="comment" v-if="cond.operator == 'mime type'">添加MimeType列表，类似于<code-label>text/html</code-label>、<code-label>image/*</code-label>。</p>
			</div>
			<div v-if="['version range'].$contains(cond.operator)">
				<div class="ui fields inline">
					<div class="ui field"><input type="text" v-model="versionRangeMinValue" maxlength="200" placeholder="最小版本" style="width: 10em"/></div>
					<div class="ui field">-</div>
					<div class="ui field"><input type="text" v-model="versionRangeMaxValue" maxlength="200" placeholder="最大版本" style="width: 10em"/></div>
				</div>
			</div>
			
			<!-- IP相关 -->
			<div v-if="['eq ip', 'gt ip', 'gte ip', 'lt ip', 'lte ip', 'ip range'].$contains(cond.operator)">
				<input type="text" style="width: 10em" v-model="stringValue" placeholder="x.x.x.x"/>
				<p class="comment">要对比的IP。</p>
			</div>
			<div v-if="['ip mod 10'].$contains(cond.operator)">
				<input type="text" maxlength="11" size="11" style="width: 5em" v-model="numberValue"/>
				<p class="comment">参数中IP转换成整数后除以10的余数，在0-9之间。</p>
			</div>
			<div v-if="['ip mod 100'].$contains(cond.operator)">
				<input type="text" maxlength="11" size="11" style="width: 5em" v-model="numberValue"/>
				<p class="comment">参数中IP转换成整数后除以100的余数，在0-99之间。</p>
			</div>
		</td>
	</tr>
	<tr v-if="['regexp', 'not regexp', 'eq', 'not', 'prefix', 'suffix', 'contains', 'not contains', 'in', 'not in'].$contains(cond.operator)">
		<td>不区分大小写</td>
		<td>
		   <div class="ui checkbox">
				<input type="checkbox" name="condIsCaseInsensitive" v-model="cond.isCaseInsensitive"/>
				<label></label>
			</div>
			<p class="comment">选中后表示对比时忽略参数值的大小写。</p>
		</td>
	</tr>
</tbody>
`
})

// 域名列表
Vue.component("domains-box", {
	props: ["v-domains", "name", "v-support-wildcard"],
	data: function () {
		let domains = this.vDomains
		if (domains == null) {
			domains = []
		}

		let realName = "domainsJSON"
		if (this.name != null && typeof this.name == "string") {
			realName = this.name
		}

		let supportWildcard = true
		if (typeof this.vSupportWildcard == "boolean") {
			supportWildcard = this.vSupportWildcard
		}

		return {
			domains: domains,

			mode: "single", // single | batch
			batchDomains: "",

			isAdding: false,
			addingDomain: "",

			isEditing: false,
			editingIndex: -1,

			realName: realName,
			supportWildcard: supportWildcard
		}
	},
	watch: {
		vSupportWildcard: function (v) {
			if (typeof v == "boolean") {
				this.supportWildcard = v
			}
		},
		mode: function (mode) {
			let that = this
			setTimeout(function () {
				if (mode == "single") {
					if (that.$refs.addingDomain != null) {
						that.$refs.addingDomain.focus()
					}
				} else if (mode == "batch") {
					if (that.$refs.batchDomains != null) {
						that.$refs.batchDomains.focus()
					}
				}
			}, 100)
		}
	},
	methods: {
		add: function () {
			this.isAdding = true
			let that = this
			setTimeout(function () {
				that.$refs.addingDomain.focus()
			}, 100)
		},
		confirm: function () {
			if (this.mode == "batch") {
				this.confirmBatch()
				return
			}

			let that = this

			// 删除其中的空格
			this.addingDomain = this.addingDomain.replace(/\s/g, "")

			if (this.addingDomain.length == 0) {
				teaweb.warn("请输入要添加的域名", function () {
					that.$refs.addingDomain.focus()
				})
				return
			}

			// 基本校验
			if (this.supportWildcard) {
				if (this.addingDomain[0] == "~") {
					let expr = this.addingDomain.substring(1)
					try {
						new RegExp(expr)
					} catch (e) {
						teaweb.warn("正则表达式错误：" + e.message, function () {
							that.$refs.addingDomain.focus()
						})
						return
					}
				}
			} else {
				if (/[*~^]/.test(this.addingDomain)) {
					teaweb.warn("当前只支持添加普通域名，域名中不能含有特殊符号", function () {
						that.$refs.addingDomain.focus()
					})
					return
				}
			}

			if (this.isEditing && this.editingIndex >= 0) {
				this.domains[this.editingIndex] = this.addingDomain
			} else {
				// 分割逗号（，）、顿号（、）
				if (this.addingDomain.match("[，、,;]")) {
					let domainList = this.addingDomain.split(new RegExp("[，、,;]"))
					domainList.forEach(function (v) {
						if (v.length > 0) {
							that.domains.push(v)
						}
					})
				} else {
					this.domains.push(this.addingDomain)
				}
			}
			this.cancel()
			this.change()
		},
		confirmBatch: function () {
			let domains = this.batchDomains.split("\n")
			let realDomains = []
			let that = this
			let hasProblems = false
			domains.forEach(function (domain) {
				if (hasProblems) {
					return
				}
				if (domain.length == 0) {
					return
				}
				if (that.supportWildcard) {
					if (domain == "~") {
						let expr = domain.substring(1)
						try {
							new RegExp(expr)
						} catch (e) {
							hasProblems = true
							teaweb.warn("正则表达式错误：" + e.message, function () {
								that.$refs.batchDomains.focus()
							})
							return
						}
					}
				} else {
					if (/[*~^]/.test(domain)) {
						hasProblems = true
						teaweb.warn("当前只支持添加普通域名，域名中不能含有特殊符号", function () {
							that.$refs.batchDomains.focus()
						})
						return
					}
				}
				realDomains.push(domain)
			})
			if (hasProblems) {
				return
			}
			if (realDomains.length == 0) {
				teaweb.warn("请输入要添加的域名", function () {
					that.$refs.batchDomains.focus()
				})
				return
			}

			realDomains.forEach(function (domain) {
				that.domains.push(domain)
			})
			this.cancel()
			this.change()
		},
		edit: function (index) {
			this.addingDomain = this.domains[index]
			this.isEditing = true
			this.editingIndex = index
			let that = this
			setTimeout(function () {
				that.$refs.addingDomain.focus()
			}, 50)
		},
		remove: function (index) {
			this.domains.$remove(index)
			this.change()
		},
		cancel: function () {
			this.isAdding = false
			this.mode = "single"
			this.batchDomains = ""
			this.isEditing = false
			this.editingIndex = -1
			this.addingDomain = ""
		},
		change: function () {
			this.$emit("change", this.domains)
		}
	},
	template: `<div>
	<input type="hidden" :name="realName" :value="JSON.stringify(domains)"/>
	<div v-if="domains.length > 0">
		<span class="ui label small basic" v-for="(domain, index) in domains" :class="{blue: index == editingIndex}">
			<span v-if="domain.length > 0 && domain[0] == '~'" class="grey" style="font-style: normal">[正则]</span>
			<span v-if="domain.length > 0 && domain[0] == '.'" class="grey" style="font-style: normal">[后缀]</span>
			<span v-if="domain.length > 0 && domain[0] == '*'" class="grey" style="font-style: normal">[泛域名]</span>
			{{domain}}
			<span v-if="!isAdding && !isEditing">
				&nbsp; <a href="" title="修改" @click.prevent="edit(index)"><i class="icon pencil small"></i></a>
				&nbsp; <a href="" title="删除" @click.prevent="remove(index)"><i class="icon remove small"></i></a>
			</span>
			<span v-if="isAdding || isEditing">
				&nbsp; <a class="disabled"><i class="icon pencil small"></i></a>
				&nbsp; <a class="disabled"><i class="icon remove small"></i></a>
			</span>
		</span>
		<div class="ui divider"></div>
	</div>
	<div v-if="isAdding || isEditing">
		<div class="ui fields">
			<div class="ui field" v-if="isAdding">
				<select class="ui dropdown" v-model="mode">
					<option value="single">单个</option>
					<option value="batch">批量</option>
				</select>
			</div>
			<div class="ui field">
				<div v-show="mode == 'single'">
					<input type="text" v-model="addingDomain" @keyup.enter="confirm()" @keypress.enter.prevent="1" @keydown.esc="cancel()" ref="addingDomain" :placeholder="supportWildcard ? 'example.com、*.example.com' : 'example.com、www.example.com'" size="30" maxlength="100"/>
				</div>
				<div v-show="mode == 'batch'">
					<textarea cols="30" v-model="batchDomains" placeholder="example1.com\nexample2.com\n每行一个域名" ref="batchDomains"></textarea>
				</div>
			</div>
			<div class="ui field">
				<button class="ui button tiny" type="button" @click.prevent="confirm">确定</button>
				&nbsp; <a href="" title="取消" @click.prevent="cancel"><i class="icon remove small"></i></a>
			</div>
		</div>
		<p class="comment" v-if="supportWildcard">支持普通域名（<code-label>example.com</code-label>）、泛域名（<code-label>*.example.com</code-label>）<span v-if="vSupportWildcard == undefined">、域名后缀（以点号开头，如<code-label>.example.com</code-label>）和正则表达式（以波浪号开头，如<code-label>~.*.example.com</code-label>）</span>；如果域名后有端口，请加上端口号。</p>
		<p class="comment" v-if="!supportWildcard">只支持普通域名（<code-label>example.com</code-label>、<code-label>www.example.com</code-label>）。</p>
		<div class="ui divider"></div>
	</div>
	<div style="margin-top: 0.5em" v-if="!isAdding">
		<button class="ui button tiny" type="button" @click.prevent="add">+</button>
	</div>
</div>`
})

Vue.component("origin-input-box", {
	props: ["v-family", "v-oss-types"],
	data: function () {
		let family = this.vFamily
		if (family == null) {
			family = "http"
		}

		let ossTypes = this.vOssTypes
		if (ossTypes == null) {
			ossTypes = []
		}

		return {
			origins: [],
			isAdding: false,
			family: family,
			ossTypes: ossTypes
		}
	},
	methods: {
		add: function () {
			let scheme = ""
			switch (this.family) {
				case "http":
					scheme = "http"
					break
				case "tcp":
					scheme = "tcp"
					break
				case "udp":
					scheme = "udp"
					break
			}
			this.origins.push({
				id: "",
				host: "",
				isPrimary: true,
				isPrimaryValue: 1,
				scheme: scheme
			})

			let that = this
			setTimeout(function () {
				let inputs = that.$refs.originHost
				if (inputs != null) {
					inputs[inputs.length - 1].focus()
				}
			}, 10)
		},
		confirm: function () {
		},
		cancel: function () {
		},
		remove: function (index) {
			this.origins.$remove(index)
		},
		changePrimary: function (origin) {
			origin.isPrimary = origin.isPrimaryValue == 1
		},
		changeFamily: function (family) {
			this.family = family
			let that = this
			this.origins.forEach(function (origin) {
				let scheme = ""
				switch (that.family) {
					case "http":
						scheme = "http"
						break
					case "tcp":
						scheme = "tcp"
						break
					case "udp":
						scheme = "udp"
						break
				}
				origin.scheme = scheme
			})
		}
	},
	template: `<div>
	<input type="hidden" name="originsJSON" :value="JSON.stringify(origins)"/>
	<div>
		<div class="ui fields inline">
			<div class="ui field" style="padding-left: 0.1em; width:6.8em; color: grey">源站协议</div>
			<div class="ui field" style="width:21em; color: grey">源站地址（Host:Port）</div>
			<div class="ui field" style="color: grey">优先级 &nbsp;<tip-icon content="优先级：优先使用主源站，如果主源站无法连接时才会连接备用源站"></tip-icon></div>
		</div>
		<div class="ui divider"></div>
		<div v-for="(origin, index) in origins">
			<div class="ui fields inline" style="margin-top: 0.6em">
				<div class="ui field">
					<select class="ui dropdown auto-width" v-model="origin.scheme">
						<option value="http" v-if="family == 'http'">http://</option>
						<option value="https" v-if="family == 'http'">https://</option>
						
						<!-- 对象存储 -->
						<optgroup label="对象存储" v-if="family == 'http' && ossTypes.length > 0"></optgroup>
						<option v-if="family == 'http'" v-for="ossType in ossTypes" :value="ossType.code">{{ossType.name}}</option>
						
						<option value="tcp" v-if="family == 'tcp'">tcp://</option>
						<option value="tls" v-if="family == 'tcp'">tls://</option>
						<option value="udp" v-if="family == 'udp'">udp://</option>
					</select>
				</div>
				<div class="ui field">
					<div v-show="origin.scheme != null && origin.scheme.startsWith('oss:')">
						请在创建网站后，再在对应网站设置"源站"功能中进行添加对象存储源站。
					</div>
					<div v-show="!origin.scheme.startsWith('oss:')">
						<input type="text" placeholder="源站地址" v-model="origin.host" ref="originHost" style="width:20em"/>
					</div>	
				</div>
				<div class="ui field">
					<div v-show="origin.scheme != null && origin.scheme.startsWith('oss:')">
					</div>
					<div v-show="!origin.scheme.startsWith('oss:')">
						<select class="ui dropdown auto-width small" v-model="origin.isPrimaryValue" @change="changePrimary(origin)">
							<option value="1">主</option>
							<option value="0">备</option>
						</select>
					</div>	
				</div>
				<div class="ui field">
					<a href="" title="删除" @click.prevent="remove(index)"><i class="icon remove icon small"></i></a>
				</div>
			</div>
		</div>
	</div>
	<div style="margin-top: 1em">
		<button class="ui button tiny" type="button" @click.prevent="add()">+</button>
	</div>
</div>`
})

// 浏览条件列表
Vue.component("http-request-conds-view", {
	props: ["v-conds"],
	data: function () {
		let conds = this.vConds
		if (conds == null) {
			conds = {
				isOn: true,
				connector: "or",
				groups: []
			}
		}
		if (conds.groups == null) {
			conds.groups = []
		}

		let that = this
		conds.groups.forEach(function (group) {
			group.conds.forEach(function (cond) {
				cond.typeName = that.typeName(cond)
			})
		})

		return {
			initConds: conds
		}
	},
	computed: {
		// 之所以使用computed，是因为需要动态更新
		conds: function () {
			return this.initConds
		}
	},
	methods: {
		typeName: function (cond) {
			let c = window.REQUEST_COND_COMPONENTS.$find(function (k, v) {
				return v.type == cond.type
			})
			if (c != null) {
				return c.name;
			}
			return cond.param + " " + cond.operator
		},
		updateConds: function (conds) {
			this.initConds = conds
		},
		notifyChange: function () {
			let that = this
			if (this.initConds.groups != null) {
				this.initConds.groups.forEach(function (group) {
					group.conds.forEach(function (cond) {
						cond.typeName = that.typeName(cond)
					})
				})
				this.$forceUpdate()
			}
		}
	},
	template: `<div>
		<div v-if="conds.groups.length > 0">
			<div v-for="(group, groupIndex) in conds.groups">
				<var v-for="(cond, index) in group.conds" style="font-style: normal;display: inline-block; margin-bottom:0.5em">
					<span class="ui label small basic" style="line-height: 1.5">
						<var v-if="cond.type.length == 0 || cond.type == 'params'" style="font-style: normal">{{cond.param}} <var>{{cond.operator}}</var></var>
						<var v-if="cond.type.length > 0 && cond.type != 'params'" style="font-style: normal">{{cond.typeName}}: </var>
						{{cond.value}}
						<sup v-if="cond.isCaseInsensitive" title="不区分大小写"><i class="icon info small"></i></sup>
					</span>
					
					<var v-if="index < group.conds.length - 1"> {{group.connector}} &nbsp;</var>
				</var>
				<div class="ui divider" v-if="groupIndex != conds.groups.length - 1" style="margin-top:0.3em;margin-bottom:0.5em"></div>
				<div>
					<span class="ui label tiny olive" v-if="group.description != null && group.description.length > 0">{{group.description}}</span>
				</div>
			</div>	
		</div>
	</div>	
</div>`
})

Vue.component("server-name-box", {
	props: ["v-server-names"],
	data: function () {
		let serverNames = this.vServerNames;
		if (serverNames == null) {
			serverNames = []
		}
		return {
			serverNames: serverNames,
			isSearching: false,
			keyword: ""
		}
	},
	methods: {
		addServerName: function () {
			window.UPDATING_SERVER_NAME = null
			let that = this
			teaweb.popup("/servers/addServerNamePopup", {
				callback: function (resp) {
					var serverName = resp.data.serverName
					that.serverNames.push(serverName)
					setTimeout(that.submitForm, 100)
				}
			});
		},

		removeServerName: function (index) {
			this.serverNames.$remove(index)
		},

		updateServerName: function (index, serverName) {
			window.UPDATING_SERVER_NAME = teaweb.clone(serverName)
			let that = this
			teaweb.popup("/servers/addServerNamePopup", {
				callback: function (resp) {
					var serverName = resp.data.serverName
					Vue.set(that.serverNames, index, serverName)
					setTimeout(that.submitForm, 100)
				}
			});
		},
		showSearchBox: function () {
			this.isSearching = !this.isSearching
			if (this.isSearching) {
				let that = this
				setTimeout(function () {
					that.$refs.keywordRef.focus()
				}, 200)
			} else {
				this.keyword = ""
			}
		},
		allServerNames: function () {
			if (this.serverNames == null) {
				return []
			}
			let result = []
			this.serverNames.forEach(function (serverName) {
				if (serverName.subNames != null && serverName.subNames.length > 0) {
					serverName.subNames.forEach(function (subName) {
						if (subName != null && subName.length > 0) {
							if (!result.$contains(subName)) {
								result.push(subName)
							}
						}
					})
				} else if (serverName.name != null && serverName.name.length > 0) {
					if (!result.$contains(serverName.name)) {
						result.push(serverName.name)
					}
				}
			})
			return result
		},
		submitForm: function () {
			//Tea.runActionOn(this.$refs.serverNamesRef.form)
		}
	},
	watch: {
		keyword: function (v) {
			this.serverNames.forEach(function (serverName) {
				if (v.length == 0) {
					serverName.isShowing = true
					return
				}
				if (serverName.subNames == null || serverName.subNames.length == 0) {
					if (!teaweb.match(serverName.name, v)) {
						serverName.isShowing = false
					}
				} else {
					let found = false
					serverName.subNames.forEach(function (subName) {
						if (teaweb.match(subName, v)) {
							found = true
						}
					})
					serverName.isShowing = found
				}
			})
		}
	},
	template: `<div>
	<input type="hidden" name="serverNames" :value="JSON.stringify(serverNames)" ref="serverNamesRef"/>
	<div v-if="serverNames.length > 0">
		<div v-for="(serverName, index) in serverNames" class="ui label small basic" :class="{hidden: serverName.isShowing === false}">
			<em v-if="serverName.type != 'full'">{{serverName.type}}</em>  
			<span v-if="serverName.subNames == null || serverName.subNames.length == 0" :class="{disabled: serverName.isShowing === false}">{{serverName.name}}</span>
			<span v-else :class="{disabled: serverName.isShowing === false}">{{serverName.subNames[0]}}等{{serverName.subNames.length}}个域名</span>
			<a href="" title="修改" @click.prevent="updateServerName(index, serverName)"><i class="icon pencil small"></i></a> <a href="" title="删除" @click.prevent="removeServerName(index)"><i class="icon remove"></i></a>
		</div>
		<div class="ui divider"></div>
	</div>
	<div class="ui fields inline">
	    <div class="ui field"><a href="" @click.prevent="addServerName()">[添加域名绑定]</a></div>
	    <div class="ui field" v-if="serverNames.length > 0"><span class="grey">|</span> </div>
	    <div class="ui field" v-if="serverNames.length > 0">
	        <a href="" @click.prevent="showSearchBox()" v-if="!isSearching"><i class="icon search small"></i></a>
	        <a href="" @click.prevent="showSearchBox()" v-if="isSearching"><i class="icon close small"></i></a>
        </div>
        <div class="ui field" v-if="isSearching">
            <input type="text" placeholder="搜索域名" ref="keywordRef" class="ui input tiny" v-model="keyword"/>
        </div>
    </div>
</div>`
})

Vue.component("http-access-log-box", {
	props: ["v-access-log"],
	data: function () {
		let accessLog = this.vAccessLog
		if (accessLog.header != null && accessLog.header.Upgrade != null && accessLog.header.Upgrade.values != null && accessLog.header.Upgrade.values.$contains("websocket")) {
			if (accessLog.scheme == "http") {
				accessLog.scheme = "ws"
			} else if (accessLog.scheme == "https") {
				accessLog.scheme = "wss"
			}
		}
		return {
			accessLog: accessLog
		}
	},
	methods: {
		formatCost: function (seconds) {
			if (seconds == null) {
				return "0"
			}
			let s = (seconds * 1000).toString();
			let pieces = s.split(".");
			if (pieces.length < 2) {
				return s;
			}

			return pieces[0] + "." + pieces[1].substring(0, 3);
		},
		showLog: function () {
			let that = this
			let requestId = this.accessLog.requestId
			this.$parent.$children.forEach(function (v) {
				if (v.deselect != null) {
					v.deselect()
				}
			})
			this.select()
			teaweb.popup("/servers/server/log/viewPopup?requestId=" + requestId, {
				width: "50em",
				height: "24em",
				onClose: function () {
					that.deselect()
				}
			})
		},
		select: function () {
			this.$refs.box.parentNode.style.cssText = "background: rgba(0, 0, 0, 0.1)"
		},
		deselect: function () {
			this.$refs.box.parentNode.style.cssText = ""
		}
	},
	template: `<div :style="{'color': (accessLog.status >= 400) ? '#dc143c' : ''}" ref="box">
	<span v-if="accessLog.region != null && accessLog.region.length > 0" class="grey">[{{accessLog.region}}]</span> {{accessLog.remoteAddr}} [{{accessLog.timeLocal}}] <em>&quot;{{accessLog.requestMethod}} {{accessLog.scheme}}://{{accessLog.host}}{{accessLog.requestURI}} <a :href="accessLog.scheme + '://' + accessLog.host + accessLog.requestURI" target="_blank" title="新窗口打开" class="disabled"><i class="external icon tiny"></i> </a> {{accessLog.proto}}&quot; </em> {{accessLog.status}} <span v-if="accessLog.attrs != null && accessLog.attrs['cache_cached'] == '1'">[cached]</span> <code-label v-if="accessLog.firewallActions != null && accessLog.firewallActions.length > 0">waf {{accessLog.firewallActions}}</code-label> <span v-if="accessLog.tags != null && accessLog.tags.length > 0">- <code-label v-for="tag in accessLog.tags">{{tag}}</code-label></span> - 耗时:{{formatCost(accessLog.requestTime)}} ms
	&nbsp; <a href="" @click.prevent="showLog" title="查看详情"><i class="icon expand"></i></a>
</div>`
})

Vue.component("origin-scheduling-view-box", {
	props: ["v-scheduling", "v-params"],
	data: function () {
		let scheduling = this.vScheduling
		if (scheduling == null) {
			scheduling = {}
		}
		return {
			scheduling: scheduling
		}
	},
	methods: {
		update: function () {
			teaweb.popup("/servers/server/settings/reverseProxy/updateSchedulingPopup?" + this.vParams, {
				height: "21em",
				callback: function () {
					window.location.reload()
				},
			})
		}
	},
	template: `<div>
	<div class="margin"></div>
	<table class="ui table selectable definition">
		<tr>
			<td class="title">当前正在使用的算法</td>
			<td>
				{{scheduling.name}} &nbsp; <a href="" @click.prevent="update()"><span>[修改]</span></a>
				<p class="comment">{{scheduling.description}}</p>
			</td>
		</tr>
	</table>
</div>`
})

Vue.component("http-redirect-to-https-box", {
	props: ["v-redirect-to-https-config", "v-is-location"],
	data: function () {
		let redirectToHttpsConfig = this.vRedirectToHttpsConfig
		if (redirectToHttpsConfig == null) {
			redirectToHttpsConfig = {
				isPrior: false,
				isOn: false,
				host: "",
				port: 0,
				status: 0,
				onlyDomains: [],
				exceptDomains: []
			}
		} else {
			if (redirectToHttpsConfig.onlyDomains == null) {
				redirectToHttpsConfig.onlyDomains = []
			}
			if (redirectToHttpsConfig.exceptDomains == null) {
				redirectToHttpsConfig.exceptDomains = []
			}
		}
		return {
			redirectToHttpsConfig: redirectToHttpsConfig,
			portString: (redirectToHttpsConfig.port > 0) ? redirectToHttpsConfig.port.toString() : "",
			moreOptionsVisible: false,
			statusOptions: [
				{"code": 301, "text": "Moved Permanently"},
				{"code": 308, "text": "Permanent Redirect"},
				{"code": 302, "text": "Found"},
				{"code": 303, "text": "See Other"},
				{"code": 307, "text": "Temporary Redirect"}
			]
		}
	},
	watch: {
		"redirectToHttpsConfig.status": function () {
			this.redirectToHttpsConfig.status = parseInt(this.redirectToHttpsConfig.status)
		},
		portString: function (v) {
			let port = parseInt(v)
			if (!isNaN(port)) {
				this.redirectToHttpsConfig.port = port
			} else {
				this.redirectToHttpsConfig.port = 0
			}
		}
	},
	methods: {
		changeMoreOptions: function (isVisible) {
			this.moreOptionsVisible = isVisible
		},
		changeOnlyDomains: function (values) {
			this.redirectToHttpsConfig.onlyDomains = values
			this.$forceUpdate()
		},
		changeExceptDomains: function (values) {
			this.redirectToHttpsConfig.exceptDomains = values
			this.$forceUpdate()
		}
	},
	template: `<div>
	<input type="hidden" name="redirectToHTTPSJSON" :value="JSON.stringify(redirectToHttpsConfig)"/>
	
	<!-- Location -->
	<table class="ui table selectable definition" v-if="vIsLocation">
		<prior-checkbox :v-config="redirectToHttpsConfig"></prior-checkbox>
		<tbody v-show="redirectToHttpsConfig.isPrior">
			<tr>
				<td class="title">自动跳转到HTTPS</td>
				<td>
					<div class="ui checkbox">
						<input type="checkbox" v-model="redirectToHttpsConfig.isOn"/>
						<label></label>
					</div>
					<p class="comment">开启后，所有HTTP的请求都会自动跳转到对应的HTTPS URL上，<more-options-angle @change="changeMoreOptions"></more-options-angle></p>
					
					<!--  TODO 如果已经设置了特殊设置，需要在界面上显示 -->
					<table class="ui table" v-show="moreOptionsVisible">
						<tr>
							<td class="title">状态码</td>
							<td>
								<select class="ui dropdown auto-width" v-model="redirectToHttpsConfig.status">
									<option value="0">[使用默认]</option>
									<option v-for="option in statusOptions" :value="option.code">{{option.code}} {{option.text}}</option>
								</select>
							</td>
						</tr>
						<tr>
							<td>域名或IP地址</td>
							<td>
								<input type="text" name="host" v-model="redirectToHttpsConfig.host"/>
								<p class="comment">默认和用户正在访问的域名或IP地址一致。</p>
							</td>
						</tr>
						<tr>
							<td>端口</td>
							<td>
								<input type="text" name="port" v-model="portString" maxlength="5" style="width:6em"/>
								<p class="comment">默认端口为443。</p>
							</td>
						</tr>
					</table>
				</td>
			</tr>	
		</tbody>
	</table>
	
	<!-- 非Location -->
	<div v-if="!vIsLocation">
		<div class="ui checkbox">
			<input type="checkbox" v-model="redirectToHttpsConfig.isOn"/>
			<label></label>
		</div>
		<p class="comment">开启后，所有HTTP的请求都会自动跳转到对应的HTTPS URL上，<more-options-angle @change="changeMoreOptions"></more-options-angle></p>
		
		<!--  TODO 如果已经设置了特殊设置，需要在界面上显示 -->
		<table class="ui table" v-show="moreOptionsVisible">
			<tr>
				<td class="title">状态码</td>
				<td>
					<select class="ui dropdown auto-width" v-model="redirectToHttpsConfig.status">
						<option value="0">[使用默认]</option>
						<option v-for="option in statusOptions" :value="option.code">{{option.code}} {{option.text}}</option>
					</select>
				</td>
			</tr>
			<tr>
				<td>跳转后域名或IP地址</td>
				<td>
					<input type="text" name="host" v-model="redirectToHttpsConfig.host"/>
					<p class="comment">默认和用户正在访问的域名或IP地址一致，不填写就表示使用当前的域名。</p>
				</td>
			</tr>
			<tr>
				<td>端口</td>
				<td>
					<input type="text" name="port" v-model="portString" maxlength="5" style="width:6em"/>
					<p class="comment">默认端口为443。</p>
				</td>
			</tr>
			<tr>
				<td>允许的域名</td>
				<td>
					<domains-box :v-domains="redirectToHttpsConfig.onlyDomains" @change="changeOnlyDomains"></domains-box>
					<p class="comment">如果填写了允许的域名，那么只有这些域名可以自动跳转。</p>
				</td>
			</tr>
			<tr>
				<td>排除的域名</td>
				<td>
					<domains-box :v-domains="redirectToHttpsConfig.exceptDomains" @change="changeExceptDomains"></domains-box>
					<p class="comment">如果填写了排除的域名，那么这些域名将不跳转。</p>
				</td>
			</tr>
		</table>
	</div>
	<div class="margin"></div>
</div>`
})

Vue.component("http-firewall-param-filters-box", {
	props: ["v-filters"],
	data: function () {
		let filters = this.vFilters
		if (filters == null) {
			filters = []
		}

		return {
			filters: filters,
			isAdding: false,
			options: [
				{name: "MD5", code: "md5"},
				{name: "URLEncode", code: "urlEncode"},
				{name: "URLDecode", code: "urlDecode"},
				{name: "BASE64Encode", code: "base64Encode"},
				{name: "BASE64Decode", code: "base64Decode"},
				{name: "UNICODE编码", code: "unicodeEncode"},
				{name: "UNICODE解码", code: "unicodeDecode"},
				{name: "HTML实体编码", code: "htmlEscape"},
				{name: "HTML实体解码", code: "htmlUnescape"},
				{name: "计算长度", code: "length"},
				{name: "十六进制->十进制", "code": "hex2dec"},
				{name: "十进制->十六进制", "code": "dec2hex"},
				{name: "SHA1", "code": "sha1"},
				{name: "SHA256", "code": "sha256"}
			],
			addingCode: ""
		}
	},
	methods: {
		add: function () {
			this.isAdding = true
			this.addingCode = ""
		},
		confirm: function () {
			if (this.addingCode.length == 0) {
				return
			}
			let that = this
			this.filters.push(this.options.$find(function (k, v) {
				return (v.code == that.addingCode)
			}))
			this.isAdding = false
		},
		cancel: function () {
			this.isAdding = false
		},
		remove: function (index) {
			this.filters.$remove(index)
		}
	},
	template: `<div>
		<input type="hidden" name="paramFiltersJSON" :value="JSON.stringify(filters)" />
		<div v-if="filters.length > 0">
			<div v-for="(filter, index) in filters" class="ui label small basic">
				{{filter.name}} <a href="" title="删除" @click.prevent="remove(index)"><i class="icon remove"></i></a>
			</div>
			<div class="ui divider"></div>
		</div>
		<div v-if="isAdding">
			<div class="ui fields inline">
				<div class="ui field">
					<select class="ui dropdown auto-width" v-model="addingCode">
						<option value="">[请选择]</option>
						<option v-for="option in options" :value="option.code">{{option.name}}</option>
					</select>
				</div>
				<div class="ui field">
					<button class="ui button tiny" type="button" @click.prevent="confirm()">确定</button>
					&nbsp; <a href="" @click.prevent="cancel()" title="取消"><i class="icon remove"></i></a>
				</div>
			</div>
		</div>
		<div v-if="!isAdding">
			<button class="ui button tiny" type="button" @click.prevent="add">+</button>
		</div>
		<p class="comment">可以对参数值进行特定的编解码处理。</p>
</div>`
})

Vue.component("http-firewall-config-box", {
	props: ["v-firewall-config", "v-is-location", "v-firewall-policy"],
	data: function () {
		let firewall = this.vFirewallConfig
		if (firewall == null) {
			firewall = {
				isPrior: false,
				isOn: false,
				firewallPolicyId: 0,
				ignoreGlobalRules: false,
				defaultCaptchaType: "none"
			}
		}

		if (firewall.defaultCaptchaType == null || firewall.defaultCaptchaType.length == 0) {
			firewall.defaultCaptchaType = "none"
		}

		let allCaptchaTypes = window.WAF_CAPTCHA_TYPES.$copy()

		// geetest
		let geeTestIsOn = false
		if (this.vFirewallPolicy != null && this.vFirewallPolicy.captchaAction != null && this.vFirewallPolicy.captchaAction.geeTestConfig != null) {
			geeTestIsOn = this.vFirewallPolicy.captchaAction.geeTestConfig.isOn
		}

		// 如果没有启用geetest，则还原
		if (!geeTestIsOn && firewall.defaultCaptchaType == "geetest") {
			firewall.defaultCaptchaType = "none"
		}

		return {
			firewall: firewall,
			moreOptionsVisible: false,
			execGlobalRules: !firewall.ignoreGlobalRules,
			captchaTypes: allCaptchaTypes,
			geeTestIsOn: geeTestIsOn
		}
	},
	watch: {
		execGlobalRules: function (v) {
			this.firewall.ignoreGlobalRules = !v
		}
	},
	methods: {
		changeOptionsVisible: function (v) {
			this.moreOptionsVisible = v
		}
	},
	template: `<div>
	<input type="hidden" name="firewallJSON" :value="JSON.stringify(firewall)"/>
	<table class="ui table selectable definition">
		<prior-checkbox :v-config="firewall" v-if="vIsLocation"></prior-checkbox>
		<tbody v-show="!vIsLocation || firewall.isPrior">
			<tr>
				<td class="title">启用Web防火墙</td>
				<td>
					<div class="ui checkbox">
						<input type="checkbox" v-model="firewall.isOn"/>
						<label></label>
					</div>
				</td>
			</tr>
		</tbody>
		<more-options-tbody @change="changeOptionsVisible" v-show="firewall.isOn"></more-options-tbody>
		<tbody v-show="moreOptionsVisible">
			<tr>
				<td>人机识别验证方式</td>
				<td>
					<select class="ui dropdown auto-width" v-model="firewall.defaultCaptchaType">
						<option value="none">默认</option>
						<option v-for="captchaType in captchaTypes"  v-if="captchaType.code != 'geetest' || geeTestIsOn"  :value="captchaType.code">{{captchaType.name}}</option>
					</select>
					<p class="comment" v-if="firewall.defaultCaptchaType == 'none'">使用系统默认的设置。你需要在入站规则中添加规则集来决定哪些请求需要人机识别验证。</p>
					<p class="comment" v-for="captchaType in captchaTypes" v-if="captchaType.code == firewall.defaultCaptchaType">{{captchaType.description}}你需要在入站规则中添加规则集来决定哪些请求需要人机识别验证。</p>
				</td>
			</tr>
			<tr>
				<td>启用系统全局规则</td>
				<td>
					<checkbox v-model="execGlobalRules"></checkbox>
					<p class="comment">选中后，表示使用系统全局WAF策略中定义的规则。</p>
				</td>
			</tr>
		</tbody>
	</table>
	<div class="margin"></div>
</div>`
})

Vue.component("ssl-config-box", {
	props: [
		"v-ssl-policy",
		"v-protocol",
		"v-server-id",
		"v-support-http3"
	],
	created: function () {
		let that = this
		setTimeout(function () {
			that.sortableCipherSuites()
		}, 100)
	},
	data: function () {
		let policy = this.vSslPolicy
		if (policy == null) {
			policy = {
				id: 0,
				isOn: true,
				certRefs: [],
				certs: [],
				clientCARefs: [],
				clientCACerts: [],
				clientAuthType: 0,
				minVersion: "TLS 1.1",
				hsts: null,
				cipherSuitesIsOn: false,
				cipherSuites: [],
				http2Enabled: true,
				http3Enabled: false,
				ocspIsOn: false
			}
		} else {
			if (policy.certRefs == null) {
				policy.certRefs = []
			}
			if (policy.certs == null) {
				policy.certs = []
			}
			if (policy.clientCARefs == null) {
				policy.clientCARefs = []
			}
			if (policy.clientCACerts == null) {
				policy.clientCACerts = []
			}
			if (policy.cipherSuites == null) {
				policy.cipherSuites = []
			}
		}

		let hsts = policy.hsts
		let hstsMaxAgeString = "31536000"
		if (hsts == null) {
			hsts = {
				isOn: false,
				maxAge: 31536000,
				includeSubDomains: false,
				preload: false,
				domains: []
			}
		}
		if (hsts.maxAge != null) {
			hstsMaxAgeString = hsts.maxAge.toString()
		}

		return {
			policy: policy,

			// hsts
			hsts: hsts,
			hstsOptionsVisible: false,
			hstsDomainAdding: false,
			hstsMaxAgeString: hstsMaxAgeString,
			addingHstsDomain: "",
			hstsDomainEditingIndex: -1,

			// 相关数据
			allVersions: window.SSL_ALL_VERSIONS,
			allCipherSuites: window.SSL_ALL_CIPHER_SUITES.$copy(),
			modernCipherSuites: window.SSL_MODERN_CIPHER_SUITES,
			intermediateCipherSuites: window.SSL_INTERMEDIATE_CIPHER_SUITES,
			allClientAuthTypes: window.SSL_ALL_CLIENT_AUTH_TYPES,
			cipherSuitesVisible: false,

			// 高级选项
			moreOptionsVisible: false
		}
	},
	watch: {
		hsts: {
			deep: true,
			handler: function () {
				this.policy.hsts = this.hsts
			}
		}
	},
	methods: {
		// 删除证书
		removeCert: function (index) {
			let that = this
			teaweb.confirm("确定删除此证书吗？证书数据仍然保留，只是当前网站不再使用此证书。", function () {
				that.policy.certRefs.$remove(index)
				that.policy.certs.$remove(index)
			})
		},

		// 选择证书
		selectCert: function () {
			let that = this
			let selectedCertIds = []
			if (this.policy != null && this.policy.certs.length > 0) {
				this.policy.certs.forEach(function (cert) {
					selectedCertIds.push(cert.id.toString())
				})
			}
			let serverId = this.vServerId
			if (serverId == null) {
				serverId = 0
			}
			teaweb.popup("/servers/certs/selectPopup?selectedCertIds=" + selectedCertIds + "&serverId=" + serverId, {
				width: "50em",
				height: "30em",
				callback: function (resp) {
					if (resp.data.cert != null && resp.data.certRef != null) {
						that.policy.certRefs.push(resp.data.certRef)
						that.policy.certs.push(resp.data.cert)
					}
					if (resp.data.certs != null && resp.data.certRefs != null) {
						that.policy.certRefs.$pushAll(resp.data.certRefs)
						that.policy.certs.$pushAll(resp.data.certs)
					}
					that.$forceUpdate()
				}
			})
		},

		// 上传证书
		uploadCert: function () {
			let that = this
			let serverId = this.vServerId
			if (typeof serverId != "number" && typeof serverId != "string") {
				serverId = 0
			}
			teaweb.popup("/servers/certs/uploadPopup?serverId=" + serverId, {
				height: "30em",
				callback: function (resp) {
					teaweb.success("上传成功", function () {
						that.policy.certRefs.push(resp.data.certRef)
						that.policy.certs.push(resp.data.cert)
					})
				}
			})
		},

		// 批量上传
		uploadBatch: function () {
			let that = this
			let serverId = this.vServerId
			if (typeof serverId != "number" && typeof serverId != "string") {
				serverId = 0
			}
			teaweb.popup("/servers/certs/uploadBatchPopup?serverId=" + serverId, {
				callback: function (resp) {
					if (resp.data.cert != null) {
						that.policy.certRefs.push(resp.data.certRef)
						that.policy.certs.push(resp.data.cert)
					}
					if (resp.data.certs != null) {
						that.policy.certRefs.$pushAll(resp.data.certRefs)
						that.policy.certs.$pushAll(resp.data.certs)
					}
					that.$forceUpdate()
				}
			})
		},

		// 申请证书
		requestCert: function () {
			// 已经在证书中的域名
			let excludeServerNames = []
			if (this.policy != null && this.policy.certs.length > 0) {
				this.policy.certs.forEach(function (cert) {
					excludeServerNames.$pushAll(cert.dnsNames)
				})
			}

			let that = this
			teaweb.popup("/servers/server/settings/https/requestCertPopup?serverId=" + this.vServerId + "&excludeServerNames=" + excludeServerNames.join(","), {
				callback: function () {
					that.policy.certRefs.push(resp.data.certRef)
					that.policy.certs.push(resp.data.cert)
				}
			})
		},

		// 更多选项
		changeOptionsVisible: function () {
			this.moreOptionsVisible = !this.moreOptionsVisible
		},

		// 格式化时间
		formatTime: function (timestamp) {
			return new Date(timestamp * 1000).format("Y-m-d")
		},

		// 格式化加密套件
		formatCipherSuite: function (cipherSuite) {
			return cipherSuite.replace(/(AES|3DES)/, "<var style=\"font-weight: bold\">$1</var>")
		},

		// 添加单个套件
		addCipherSuite: function (cipherSuite) {
			if (!this.policy.cipherSuites.$contains(cipherSuite)) {
				this.policy.cipherSuites.push(cipherSuite)
			}
			this.allCipherSuites.$removeValue(cipherSuite)
		},

		// 删除单个套件
		removeCipherSuite: function (cipherSuite) {
			let that = this
			teaweb.confirm("确定要删除此套件吗？", function () {
				that.policy.cipherSuites.$removeValue(cipherSuite)
				that.allCipherSuites = window.SSL_ALL_CIPHER_SUITES.$findAll(function (k, v) {
					return !that.policy.cipherSuites.$contains(v)
				})
			})
		},

		// 清除所选套件
		clearCipherSuites: function () {
			let that = this
			teaweb.confirm("确定要清除所有已选套件吗？", function () {
				that.policy.cipherSuites = []
				that.allCipherSuites = window.SSL_ALL_CIPHER_SUITES.$copy()
			})
		},

		// 批量添加套件
		addBatchCipherSuites: function (suites) {
			var that = this
			teaweb.confirm("确定要批量添加套件？", function () {
				suites.$each(function (k, v) {
					if (that.policy.cipherSuites.$contains(v)) {
						return
					}
					that.policy.cipherSuites.push(v)
				})
			})
		},

		/**
		 * 套件拖动排序
		 */
		sortableCipherSuites: function () {
			var box = document.querySelector(".cipher-suites-box")
			Sortable.create(box, {
				draggable: ".label",
				handle: ".icon.handle",
				onStart: function () {

				},
				onUpdate: function (event) {

				}
			})
		},

		// 显示所有套件
		showAllCipherSuites: function () {
			this.cipherSuitesVisible = !this.cipherSuitesVisible
		},

		// 显示HSTS更多选项
		showMoreHSTS: function () {
			this.hstsOptionsVisible = !this.hstsOptionsVisible;
			if (this.hstsOptionsVisible) {
				this.changeHSTSMaxAge()
			}
		},

		// 监控HSTS有效期修改
		changeHSTSMaxAge: function () {
			var v = parseInt(this.hstsMaxAgeString)
			if (isNaN(v) || v < 0) {
				this.hsts.maxAge = 0
				this.hsts.days = "-"
				return
			}
			this.hsts.maxAge = v
			this.hsts.days = v / 86400
			if (this.hsts.days == 0) {
				this.hsts.days = "-"
			}
		},

		// 设置HSTS有效期
		setHSTSMaxAge: function (maxAge) {
			this.hstsMaxAgeString = maxAge.toString()
			this.changeHSTSMaxAge()
		},

		// 添加HSTS域名
		addHstsDomain: function () {
			this.hstsDomainAdding = true
			this.hstsDomainEditingIndex = -1
			let that = this
			setTimeout(function () {
				that.$refs.addingHstsDomain.focus()
			}, 100)
		},

		// 修改HSTS域名
		editHstsDomain: function (index) {
			this.hstsDomainEditingIndex = index
			this.addingHstsDomain = this.hsts.domains[index]
			this.hstsDomainAdding = true
			let that = this
			setTimeout(function () {
				that.$refs.addingHstsDomain.focus()
			}, 100)
		},

		// 确认HSTS域名添加
		confirmAddHstsDomain: function () {
			this.addingHstsDomain = this.addingHstsDomain.trim()
			if (this.addingHstsDomain.length == 0) {
				return;
			}
			if (this.hstsDomainEditingIndex > -1) {
				this.hsts.domains[this.hstsDomainEditingIndex] = this.addingHstsDomain
			} else {
				this.hsts.domains.push(this.addingHstsDomain)
			}
			this.cancelHstsDomainAdding()
		},

		// 取消HSTS域名添加
		cancelHstsDomainAdding: function () {
			this.hstsDomainAdding = false
			this.addingHstsDomain = ""
			this.hstsDomainEditingIndex = -1
		},

		// 删除HSTS域名
		removeHstsDomain: function (index) {
			this.cancelHstsDomainAdding()
			this.hsts.domains.$remove(index)
		},

		// 选择客户端CA证书
		selectClientCACert: function () {
			let that = this
			teaweb.popup("/servers/certs/selectPopup?isCA=1", {
				width: "50em",
				height: "30em",
				callback: function (resp) {
					if (resp.data.cert != null && resp.data.certRef != null) {
						that.policy.clientCARefs.push(resp.data.certRef)
						that.policy.clientCACerts.push(resp.data.cert)
					}
					if (resp.data.certs != null && resp.data.certRefs != null) {
						that.policy.clientCARefs.$pushAll(resp.data.certRefs)
						that.policy.clientCACerts.$pushAll(resp.data.certs)
					}
					that.$forceUpdate()
				}
			})
		},

		// 上传CA证书
		uploadClientCACert: function () {
			let that = this
			teaweb.popup("/servers/certs/uploadPopup?isCA=1", {
				height: "28em",
				callback: function (resp) {
					teaweb.success("上传成功", function () {
						that.policy.clientCARefs.push(resp.data.certRef)
						that.policy.clientCACerts.push(resp.data.cert)
					})
				}
			})
		},

		// 删除客户端CA证书
		removeClientCACert: function (index) {
			let that = this
			teaweb.confirm("确定删除此证书吗？证书数据仍然保留，只是当前网站不再使用此证书。", function () {
				that.policy.clientCARefs.$remove(index)
				that.policy.clientCACerts.$remove(index)
			})
		}
	},
	template: `<div>
	<h4>SSL/TLS相关配置</h4>
	<input type="hidden" name="sslPolicyJSON" :value="JSON.stringify(policy)"/>
	<table class="ui table definition selectable">
		<tbody>
			<tr v-show="vProtocol == 'https'">
				<td class="title">启用HTTP/2</td>
				<td>
					<div class="ui checkbox">
						<input type="checkbox" value="1" v-model="policy.http2Enabled"/>
						<label></label>
					</div>
				</td>
			</tr>
			<tr v-show="vProtocol == 'https' && vSupportHttp3">
				<td class="title">启用HTTP/3</td>
				<td>
					<div class="ui checkbox">
						<input type="checkbox" value="1" v-model="policy.http3Enabled"/>
						<label></label>
					</div>
				</td>
			</tr>
			<tr>
				<td class="title">设置证书</td>
				<td>
					<div v-if="policy.certs != null && policy.certs.length > 0">
						<div class="ui label small basic" v-for="(cert, index) in policy.certs" style="margin-top: 0.2em">
							{{cert.name}} / {{cert.dnsNames}} / 有效至{{formatTime(cert.timeEndAt)}} &nbsp; <a href="" title="删除" @click.prevent="removeCert(index)"><i class="icon remove"></i></a>
						</div>
						<div class="ui divider"></div>
					</div>
					<div v-else>
						<span class="red">选择或上传证书后<span v-if="vProtocol == 'https'">HTTPS</span><span v-if="vProtocol == 'tls'">TLS</span>服务才能生效。</span>
						<div class="ui divider"></div>
					</div>
					<button class="ui button tiny" type="button" @click.prevent="selectCert()">选择已有证书</button> &nbsp;
					<span class="disabled">|</span> &nbsp;
					<button class="ui button tiny" type="button" @click.prevent="uploadCert()">上传新证书</button> &nbsp;
					<button class="ui button tiny" type="button" @click.prevent="uploadBatch()">批量上传证书</button> &nbsp;
					<span class="disabled">|</span> &nbsp;
					<button class="ui button tiny" type="button" @click.prevent="requestCert()" v-if="vServerId != null && vServerId > 0">申请免费证书</button>
				</td>
			</tr>
			<tr>
				<td>TLS最低版本</td>
				<td>
					<select v-model="policy.minVersion" class="ui dropdown auto-width">
						<option v-for="version in allVersions" :value="version">{{version}}</option>
					</select>
				</td>
			</tr>
		</tbody>
		<more-options-tbody @change="changeOptionsVisible"></more-options-tbody>
		<tbody v-show="moreOptionsVisible">
			<!-- 加密套件 -->
			<tr>
				<td>加密算法套件<em>（CipherSuites）</em></td>
				<td>
					<div class="ui checkbox">
						<input type="checkbox" value="1" v-model="policy.cipherSuitesIsOn" />
						<label>是否要自定义</label>
					</div>
					<div v-show="policy.cipherSuitesIsOn">
						<div class="ui divider"></div>
						<div class="cipher-suites-box">
							已添加套件({{policy.cipherSuites.length}})：
							<div v-for="cipherSuite in policy.cipherSuites" class="ui label tiny basic" style="margin-bottom: 0.5em">
								<input type="hidden" name="cipherSuites" :value="cipherSuite"/>
								<span v-html="formatCipherSuite(cipherSuite)"></span> &nbsp; <a href="" title="删除套件" @click.prevent="removeCipherSuite(cipherSuite)"><i class="icon remove"></i></a>
								<a href="" title="拖动改变顺序"><i class="icon bars handle"></i></a>
							</div>
						</div>
						<div>
							<div class="ui divider"></div>
							<span v-if="policy.cipherSuites.length > 0"><a href="" @click.prevent="clearCipherSuites()">[清除所有已选套件]</a> &nbsp; </span>
							<a href="" @click.prevent="addBatchCipherSuites(modernCipherSuites)">[添加推荐套件]</a> &nbsp;
							<a href="" @click.prevent="addBatchCipherSuites(intermediateCipherSuites)">[添加兼容套件]</a>
							<div class="ui divider"></div>
						</div>
		
						<div class="cipher-all-suites-box">
							<a href="" @click.prevent="showAllCipherSuites()"><span v-if="policy.cipherSuites.length == 0">所有</span>可选套件({{allCipherSuites.length}}) <i class="icon angle" :class="{down:!cipherSuitesVisible, up:cipherSuitesVisible}"></i></a>
							<a href="" v-if="cipherSuitesVisible" v-for="cipherSuite in allCipherSuites" class="ui label tiny" title="点击添加到自定义套件中" @click.prevent="addCipherSuite(cipherSuite)" v-html="formatCipherSuite(cipherSuite)" style="margin-bottom:0.5em"></a>
						</div>
						<p class="comment" v-if="cipherSuitesVisible">点击可选套件添加。</p>
					</div>
				</td>
			</tr>
			
			<!-- HSTS -->
			<tr v-show="vProtocol == 'https'">
				<td :class="{'color-border':hsts.isOn}">开启HSTS</td>
				<td>
					<div class="ui checkbox">
						<input type="checkbox" name="hstsOn" v-model="hsts.isOn" value="1"/>
						<label></label>
					</div>
					<p class="comment">
						 开启后，会自动在响应Header中加入
						 <span class="ui label small">Strict-Transport-Security:
							 <var v-if="!hsts.isOn">...</var>
							 <var v-if="hsts.isOn"><span>max-age=</span>{{hsts.maxAge}}</var>
							 <var v-if="hsts.isOn && hsts.includeSubDomains">; includeSubDomains</var>
							 <var v-if="hsts.isOn && hsts.preload">; preload</var>
						 </span>
						  <span v-if="hsts.isOn">
							<a href="" @click.prevent="showMoreHSTS()">修改<i class="icon angle" :class="{down:!hstsOptionsVisible, up:hstsOptionsVisible}"></i> </a>
						 </span>
					</p>
				</td>
			</tr>
			<tr v-show="hsts.isOn && hstsOptionsVisible">
				<td class="color-border">HSTS有效时间<em>（max-age）</em></td>
				<td>
					<div class="ui fields inline">
						<div class="ui field">
							<input type="text" name="hstsMaxAge" v-model="hstsMaxAgeString" maxlength="10" size="10" @input="changeHSTSMaxAge()"/>
						</div>
						<div class="ui field">
							秒
						</div>
						<div class="ui field">{{hsts.days}}天</div>
					</div>
					<p class="comment">
						<a href="" @click.prevent="setHSTSMaxAge(31536000)" :class="{active:hsts.maxAge == 31536000}">[1年/365天]</a> &nbsp; &nbsp;
						<a href="" @click.prevent="setHSTSMaxAge(15768000)" :class="{active:hsts.maxAge == 15768000}">[6个月/182.5天]</a> &nbsp;  &nbsp;
						<a href="" @click.prevent="setHSTSMaxAge(2592000)"  :class="{active:hsts.maxAge == 2592000}">[1个月/30天]</a>
					</p>
				</td>
			</tr>
			<tr v-show="hsts.isOn && hstsOptionsVisible">
				<td class="color-border">HSTS包含子域名<em>（includeSubDomains）</em></td>
				<td>
					<div class="ui checkbox">
						<input type="checkbox" name="hstsIncludeSubDomains" value="1" v-model="hsts.includeSubDomains"/>
						<label></label>
					</div>
				</td>
			</tr>
			<tr v-show="hsts.isOn && hstsOptionsVisible">
				<td class="color-border">HSTS预加载<em>（preload）</em></td>
				<td>
					<div class="ui checkbox">
						<input type="checkbox" name="hstsPreload" value="1" v-model="hsts.preload"/>
						<label></label>
					</div>
				</td>
			</tr>
			<tr v-show="hsts.isOn && hstsOptionsVisible">
				<td class="color-border">HSTS生效的域名</td>
				<td colspan="2">
					<div class="names-box">
					<span class="ui label tiny basic" v-for="(domain, arrayIndex) in hsts.domains" :class="{blue:hstsDomainEditingIndex == arrayIndex}">{{domain}}
						<input type="hidden" name="hstsDomains" :value="domain"/> &nbsp;
						<a href="" @click.prevent="editHstsDomain(arrayIndex)" title="修改"><i class="icon pencil"></i></a>
						<a href="" @click.prevent="removeHstsDomain(arrayIndex)" title="删除"><i class="icon remove"></i></a>
					</span>
					</div>
					<div class="ui fields inline" v-if="hstsDomainAdding" style="margin-top:0.8em">
						<div class="ui field">
							<input type="text" name="addingHstsDomain" ref="addingHstsDomain" style="width:16em" maxlength="100" placeholder="域名，比如example.com" @keyup.enter="confirmAddHstsDomain()" @keypress.enter.prevent="1" v-model="addingHstsDomain" />
						</div>
						<div class="ui field">
							<button class="ui button tiny" type="button" @click="confirmAddHstsDomain()">确定</button>
							&nbsp; <a href="" @click.prevent="cancelHstsDomainAdding()">取消</a>
						</div>
					</div>
					<div class="ui field" style="margin-top: 1em">
						<button class="ui button tiny" type="button" @click="addHstsDomain()">+</button>
					</div>
					<p class="comment">如果没有设置域名的话，则默认支持所有的域名。</p>
				</td>
			</tr>
			
			<!-- OCSP -->
			<tr>
				<td>OCSP Stapling</td>
				<td><checkbox name="ocspIsOn" v-model="policy.ocspIsOn"></checkbox>
					<p class="comment">选中表示启用OCSP Stapling。</p>
				</td>
			</tr>
			
			<!-- 客户端认证 -->
			<tr>
				<td>客户端认证方式</td>
				<td>
					<select name="clientAuthType" v-model="policy.clientAuthType" class="ui dropdown auto-width">
						<option v-for="authType in allClientAuthTypes" :value="authType.type">{{authType.name}}</option>
					</select>
				</td>
			</tr>
			<tr>
				<td>客户端认证CA证书</td>
				<td>
					<div v-if="policy.clientCACerts != null && policy.clientCACerts.length > 0">
						<div class="ui label small basic" v-for="(cert, index) in policy.clientCACerts">
							{{cert.name}} / {{cert.dnsNames}} / 有效至{{formatTime(cert.timeEndAt)}} &nbsp; <a href="" title="删除" @click.prevent="removeClientCACert()"><i class="icon remove"></i></a>
						</div>
						<div class="ui divider"></div>
					</div>
					<button class="ui button tiny" type="button" @click.prevent="selectClientCACert()">选择已有证书</button> &nbsp;
					<button class="ui button tiny" type="button" @click.prevent="uploadClientCACert()">上传新证书</button>
					<p class="comment">用来校验客户端证书以增强安全性，通常不需要设置。</p>
				</td>
			</tr>
		</tbody>	
	</table>
	<div class="ui margin"></div>
</div>`
})

// 认证设置
Vue.component("http-auth-config-box", {
	props: ["v-auth-config", "v-is-location"],
	data: function () {
		let authConfig = this.vAuthConfig
		if (authConfig == null) {
			authConfig = {
				isPrior: false,
				isOn: false
			}
		}
		if (authConfig.policyRefs == null) {
			authConfig.policyRefs = []
		}
		return {
			authConfig: authConfig
		}
	},
	methods: {
		isOn: function () {
			return (!this.vIsLocation || this.authConfig.isPrior) && this.authConfig.isOn
		},
		add: function () {
			let that = this
			teaweb.popup("/servers/server/settings/access/createPopup", {
				callback: function (resp) {
					that.authConfig.policyRefs.push(resp.data.policyRef)
					that.change()
				},
				height: "28em"
			})
		},
		update: function (index, policyId) {
			let that = this
			teaweb.popup("/servers/server/settings/access/updatePopup?policyId=" + policyId, {
				callback: function (resp) {
					teaweb.success("保存成功", function () {
						teaweb.reload()
					})
				},
				height: "28em"
			})
		},
		remove: function (index) {
			this.authConfig.policyRefs.$remove(index)
			this.change()
		},
		methodName: function (methodType) {
			switch (methodType) {
				case "basicAuth":
					return "BasicAuth"
				case "subRequest":
					return "子请求"
				case "typeA":
					return "URL鉴权A"
				case "typeB":
					return "URL鉴权B"
				case "typeC":
					return "URL鉴权C"
				case "typeD":
					return "URL鉴权D"
			}
			return ""
		},
		change: function () {
			let that = this
			setTimeout(function () {
				// 延时通知，是为了让表单有机会变更数据
				that.$emit("change", this.authConfig)
			}, 100)
		}
	},
	template: `<div>
<input type="hidden" name="authJSON" :value="JSON.stringify(authConfig)"/> 
<table class="ui table selectable definition">
	<prior-checkbox :v-config="authConfig" v-if="vIsLocation"></prior-checkbox>
	<tbody v-show="!vIsLocation || authConfig.isPrior">
		<tr>
			<td class="title">启用鉴权</td>
			<td>
				<div class="ui checkbox">
					<input type="checkbox" v-model="authConfig.isOn"/>
					<label></label>
				</div>
			</td>
		</tr>
	</tbody>
</table>
<div class="margin"></div>
<!-- 鉴权方式 -->
<div v-show="isOn()">
	<h4>鉴权方式</h4>
	<table class="ui table selectable celled" v-show="authConfig.policyRefs.length > 0">
		<thead>
			<tr>
				<th class="three wide">名称</th>
				<th class="three wide">鉴权方法</th>
				<th>参数</th>
				<th class="two wide">状态</th>
				<th class="two op">操作</th>
			</tr>
		</thead>
		<tbody v-for="(ref, index) in authConfig.policyRefs" :key="ref.authPolicyId">
			<tr>
				<td>{{ref.authPolicy.name}}</td>
				<td>
					{{methodName(ref.authPolicy.type)}}
				</td>
				<td>
					<span v-if="ref.authPolicy.type == 'basicAuth'">{{ref.authPolicy.params.users.length}}个用户</span>
					<span v-if="ref.authPolicy.type == 'subRequest'">
						<span v-if="ref.authPolicy.params.method.length > 0" class="grey">[{{ref.authPolicy.params.method}}]</span>
						{{ref.authPolicy.params.url}}
					</span>
					<span v-if="ref.authPolicy.type == 'typeA'">{{ref.authPolicy.params.signParamName}}/有效期{{ref.authPolicy.params.life}}秒</span>
					<span v-if="ref.authPolicy.type == 'typeB'">有效期{{ref.authPolicy.params.life}}秒</span>
					<span v-if="ref.authPolicy.type == 'typeC'">有效期{{ref.authPolicy.params.life}}秒</span>
					<span v-if="ref.authPolicy.type == 'typeD'">{{ref.authPolicy.params.signParamName}}/{{ref.authPolicy.params.timestampParamName}}/有效期{{ref.authPolicy.params.life}}秒</span>
					
					<div v-if="(ref.authPolicy.params.exts != null && ref.authPolicy.params.exts.length > 0) || (ref.authPolicy.params.domains != null && ref.authPolicy.params.domains.length > 0)">
						<grey-label v-if="ref.authPolicy.params.exts != null" v-for="ext in ref.authPolicy.params.exts">扩展名：{{ext}}</grey-label>
						<grey-label v-if="ref.authPolicy.params.domains != null" v-for="domain in ref.authPolicy.params.domains">域名：{{domain}}</grey-label>
					</div>
				</td>
				<td>
					<label-on :v-is-on="ref.authPolicy.isOn"></label-on>
				</td>
				<td>
					<a href="" @click.prevent="update(index, ref.authPolicyId)">修改</a> &nbsp;
					<a href="" @click.prevent="remove(index)">删除</a>
				</td>
			</tr>
		</tbody>
	</table>
	<button class="ui button small" type="button" @click.prevent="add">+添加鉴权方式</button>
</div>
<div class="margin"></div>
</div>`
})

Vue.component("http-request-cond-view", {
	props: ["v-cond"],
	data: function () {
		return {
			cond: this.vCond,
			components: window.REQUEST_COND_COMPONENTS
		}
	},
	methods: {
		typeName: function (cond) {
			let c = this.components.$find(function (k, v) {
				return v.type == cond.type
			})
			if (c != null) {
				return c.name;
			}
			return cond.param + " " + cond.operator
		},
		updateConds: function (conds, simpleCond) {
			for (let k in simpleCond) {
				if (simpleCond.hasOwnProperty(k)) {
					this.cond[k] = simpleCond[k]
				}
			}
		},
		notifyChange: function () {

		}
	},
	template: `<div style="margin-bottom: 0.5em">
	<span class="ui label small basic">
		<var v-if="cond.type.length == 0 || cond.type == 'params'" style="font-style: normal">{{cond.param}} <var>{{cond.operator}}</var></var>
		<var v-if="cond.type.length > 0 && cond.type != 'params'" style="font-style: normal">{{typeName(cond)}}: </var>
		{{cond.value}}
		<sup v-if="cond.isCaseInsensitive" title="不区分大小写"><i class="icon info small"></i></sup>
	</span>
</div>`
})

// Action列表
Vue.component("http-firewall-actions-view", {
	props: ["v-actions"],
	template: `<div>
		<div v-for="action in vActions" style="margin-bottom: 0.3em">
			<span :class="{red: action.category == 'block', orange: action.category == 'verify', green: action.category == 'allow'}">{{action.name}} ({{action.code.toUpperCase()}})
			  	<div v-if="action.options != null">
			  		<span class="grey small" v-if="action.code.toLowerCase() == 'page'">[{{action.options.status}}]</span>
			  		<span class="grey small" v-if="action.code.toLowerCase() == 'allow' && action.options != null && action.options.scope != null && action.options.scope.length > 0">
			  			<span v-if="action.options.scope == 'group'">[分组]</span>
						<span v-if="action.options.scope == 'server'">[网站]</span>
						<span v-if="action.options.scope == 'global'">[网站和策略]</span>	
					</span>
					<span class="grey small" v-if="action.code.toLowerCase() == 'record_ip'">
						<span v-if="action.options.type == 'black'" class="red">黑名单</span>
						<span v-if="action.options.type == 'white'" class="green">白名单</span>
						<span v-if="action.options.type == 'grey'" class="grey">灰名单</span>
					</span>
				</div>	
			</span>
		</div>             
</div>`
})

Vue.component("http-stat-config-box", {
	props: ["v-stat-config", "v-is-location"],
	data: function () {
		let stat = this.vStatConfig
		if (stat == null) {
			stat = {
				isPrior: false,
				isOn: false
			}
		}
		return {
			stat: stat
		}
	},
	template: `<div>
	<input type="hidden" name="statJSON" :value="JSON.stringify(stat)"/>
	<table class="ui table definition selectable">
		<prior-checkbox :v-config="stat" v-if="vIsLocation" ></prior-checkbox>
		<tbody v-show="!vIsLocation || stat.isPrior">
			<tr>
				<td class="title">启用统计</td>
				<td>
					<div class="ui checkbox">
						<input type="checkbox" v-model="stat.isOn"/>
						<label></label>
					</div>
				</td>
			</tr>
		</tbody>
	</table>
<div class="margin"></div>
</div>`
})

Vue.component("http-header-policy-box", {
	props: ["v-request-header-policy", "v-request-header-ref", "v-response-header-policy", "v-response-header-ref", "v-params", "v-is-location", "v-is-group", "v-has-group-request-config", "v-has-group-response-config", "v-group-setting-url"],
	data: function () {
		let type = "response"
		let hash = window.location.hash
		if (hash == "#request") {
			type = "request"
		}

		// ref
		let requestHeaderRef = this.vRequestHeaderRef
		if (requestHeaderRef == null) {
			requestHeaderRef = {
				isPrior: false,
				isOn: true,
				headerPolicyId: 0
			}
		}

		let responseHeaderRef = this.vResponseHeaderRef
		if (responseHeaderRef == null) {
			responseHeaderRef = {
				isPrior: false,
				isOn: true,
				headerPolicyId: 0
			}
		}

		// 请求相关
		let requestSettingHeaders = []
		let requestDeletingHeaders = []
		let requestNonStandardHeaders = []

		let requestPolicy = this.vRequestHeaderPolicy
		if (requestPolicy != null) {
			if (requestPolicy.setHeaders != null) {
				requestSettingHeaders = requestPolicy.setHeaders
			}
			if (requestPolicy.deleteHeaders != null) {
				requestDeletingHeaders = requestPolicy.deleteHeaders
			}
			if (requestPolicy.nonStandardHeaders != null) {
				requestNonStandardHeaders = requestPolicy.nonStandardHeaders
			}
		}

		// 响应相关
		let responseSettingHeaders = []
		let responseDeletingHeaders = []
		let responseNonStandardHeaders = []

		let responsePolicy = this.vResponseHeaderPolicy
		if (responsePolicy != null) {
			if (responsePolicy.setHeaders != null) {
				responseSettingHeaders = responsePolicy.setHeaders
			}
			if (responsePolicy.deleteHeaders != null) {
				responseDeletingHeaders = responsePolicy.deleteHeaders
			}
			if (responsePolicy.nonStandardHeaders != null) {
				responseNonStandardHeaders = responsePolicy.nonStandardHeaders
			}
		}

		let responseCORS = {
			isOn: false
		}
		if (responsePolicy.cors != null) {
			responseCORS = responsePolicy.cors
		}

		return {
			type: type,
			typeName: (type == "request") ? "请求" : "响应",

			requestHeaderRef: requestHeaderRef,
			responseHeaderRef: responseHeaderRef,
			requestSettingHeaders: requestSettingHeaders,
			requestDeletingHeaders: requestDeletingHeaders,
			requestNonStandardHeaders: requestNonStandardHeaders,

			responseSettingHeaders: responseSettingHeaders,
			responseDeletingHeaders: responseDeletingHeaders,
			responseNonStandardHeaders: responseNonStandardHeaders,
			responseCORS: responseCORS
		}
	},
	methods: {
		selectType: function (type) {
			this.type = type
			window.location.hash = "#" + type
			window.location.reload()
		},
		addSettingHeader: function (policyId) {
			teaweb.popup("/servers/server/settings/headers/createSetPopup?" + this.vParams + "&headerPolicyId=" + policyId + "&type=" + this.type, {
				height: "22em",
				callback: function () {
					teaweb.successRefresh("保存成功")
				}
			})
		},
		addDeletingHeader: function (policyId, type) {
			teaweb.popup("/servers/server/settings/headers/createDeletePopup?" + this.vParams + "&headerPolicyId=" + policyId + "&type=" + type, {
				callback: function () {
					teaweb.successRefresh("保存成功")
				}
			})
		},
		addNonStandardHeader: function (policyId, type) {
			teaweb.popup("/servers/server/settings/headers/createNonStandardPopup?" + this.vParams + "&headerPolicyId=" + policyId + "&type=" + type, {
				callback: function () {
					teaweb.successRefresh("保存成功")
				}
			})
		},
		updateSettingPopup: function (policyId, headerId) {
			teaweb.popup("/servers/server/settings/headers/updateSetPopup?" + this.vParams + "&headerPolicyId=" + policyId + "&headerId=" + headerId + "&type=" + this.type, {
				height: "22em",
				callback: function () {
					teaweb.successRefresh("保存成功")
				}
			})
		},
		deleteDeletingHeader: function (policyId, headerName) {
			teaweb.confirm("确定要删除'" + headerName + "'吗？", function () {
				Tea.action("/servers/server/settings/headers/deleteDeletingHeader")
					.params({
						headerPolicyId: policyId,
						headerName: headerName
					})
					.post()
					.refresh()
			})
		},
		deleteNonStandardHeader: function (policyId, headerName) {
			teaweb.confirm("确定要删除'" + headerName + "'吗？", function () {
				Tea.action("/servers/server/settings/headers/deleteNonStandardHeader")
					.params({
						headerPolicyId: policyId,
						headerName: headerName
					})
					.post()
					.refresh()
			})
		},
		deleteHeader: function (policyId, type, headerId) {
			teaweb.confirm("确定要删除此报头吗？", function () {
					this.$post("/servers/server/settings/headers/delete")
						.params({
							headerPolicyId: policyId,
							type: type,
							headerId: headerId
						})
						.refresh()
				}
			)
		},
		updateCORS: function (policyId) {
			teaweb.popup("/servers/server/settings/headers/updateCORSPopup?" + this.vParams + "&headerPolicyId=" + policyId + "&type=" + this.type, {
				height: "30em",
				callback: function () {
					teaweb.successRefresh("保存成功")
				}
			})
		}
	},
	template: `<div>
	<div class="ui menu tabular small">
		<a class="item" :class="{active:type == 'response'}" @click.prevent="selectType('response')">响应报头<span v-if="responseSettingHeaders.length > 0">({{responseSettingHeaders.length}})</span></a>
		<a class="item" :class="{active:type == 'request'}" @click.prevent="selectType('request')">请求报头<span v-if="requestSettingHeaders.length > 0">({{requestSettingHeaders.length}})</span></a>
	</div>
	
	<div class="margin"></div>
	
	<input type="hidden" name="type" :value="type"/>
	
	<!-- 请求 -->
	<div v-if="(vIsLocation || vIsGroup) && type == 'request'">
		<input type="hidden" name="requestHeaderJSON" :value="JSON.stringify(requestHeaderRef)"/>
		<table class="ui table definition selectable">
			<prior-checkbox :v-config="requestHeaderRef"></prior-checkbox>
		</table>
		<submit-btn></submit-btn>
	</div>
	
	<div v-if="((!vIsLocation && !vIsGroup) || requestHeaderRef.isPrior) && type == 'request'">
		<div v-if="vHasGroupRequestConfig">
        	<div class="margin"></div>
        	<warning-message>由于已经在当前<a :href="vGroupSettingUrl + '#request'">网站分组</a>中进行了对应的配置，在这里的配置将不会生效。</warning-message>
    	</div>
    	<div :class="{'opacity-mask': vHasGroupRequestConfig}">
		<h4>设置请求报头 &nbsp; <a href="" @click.prevent="addSettingHeader(vRequestHeaderPolicy.id)" style="font-size: 0.8em">[添加新报头]</a></h4>
			<p class="comment" v-if="requestSettingHeaders.length == 0">暂时还没有自定义报头。</p>
			<table class="ui table selectable celled" v-if="requestSettingHeaders.length > 0">
				<thead>
					<tr>
						<th>名称</th>
						<th>值</th>
						<th class="two op">操作</th>
					</tr>
				</thead>
				<tbody v-for="header in requestSettingHeaders">
					<tr>
						<td class="five wide">
							<a href="" @click.prevent="updateSettingPopup(vRequestHeaderPolicy.id, header.id)">{{header.name}} <i class="icon expand small"></i></a>
							<div>
								<span v-if="header.status != null && header.status.codes != null && !header.status.always"><grey-label v-for="code in header.status.codes" :key="code">{{code}}</grey-label></span>
								<span v-if="header.methods != null && header.methods.length > 0"><grey-label v-for="method in header.methods" :key="method">{{method}}</grey-label></span>
								<span v-if="header.domains != null && header.domains.length > 0"><grey-label v-for="domain in header.domains" :key="domain">{{domain}}</grey-label></span>
								<grey-label v-if="header.shouldAppend">附加</grey-label>
								<grey-label v-if="header.disableRedirect">跳转禁用</grey-label>
								<grey-label v-if="header.shouldReplace && header.replaceValues != null && header.replaceValues.length > 0">替换</grey-label>
							</div>
						</td>
						<td>{{header.value}}</td>
						<td><a href="" @click.prevent="updateSettingPopup(vRequestHeaderPolicy.id, header.id)">修改</a> &nbsp; <a href="" @click.prevent="deleteHeader(vRequestHeaderPolicy.id, 'setHeader', header.id)">删除</a> </td>
					</tr>
				</tbody>
			</table>
			
			<h4>其他设置</h4>
			
			<table class="ui table definition selectable">
				<tbody>
					<tr>
						<td class="title">删除报头 <tip-icon content="可以通过此功能删除转发到源站的请求报文中不需要的报头"></tip-icon></td>
						<td>
							<div v-if="requestDeletingHeaders.length > 0">
								<div class="ui label small basic" v-for="headerName in requestDeletingHeaders">{{headerName}} <a href=""><i class="icon remove" title="删除" @click.prevent="deleteDeletingHeader(vRequestHeaderPolicy.id, headerName)"></i></a> </div>
								<div class="ui divider" ></div>
							</div>
							<button class="ui button small" type="button" @click.prevent="addDeletingHeader(vRequestHeaderPolicy.id, 'request')">+</button>
						</td>
					</tr>
					<tr>
						<td class="title">非标报头 <tip-icon content="可以通过此功能设置转发到源站的请求报文中非标准的报头，比如hello_world"></tip-icon></td>
						<td>
							<div v-if="requestNonStandardHeaders.length > 0">
								<div class="ui label small basic" v-for="headerName in requestNonStandardHeaders">{{headerName}} <a href=""><i class="icon remove" title="删除" @click.prevent="deleteNonStandardHeader(vRequestHeaderPolicy.id, headerName)"></i></a> </div>
								<div class="ui divider" ></div>
							</div>
							<button class="ui button small" type="button" @click.prevent="addNonStandardHeader(vRequestHeaderPolicy.id, 'request')">+</button>
						</td>
					</tr>
				</tbody>
			</table>
		</div>			
	</div>
	
	<!-- 响应 -->
	<div v-if="(vIsLocation || vIsGroup) && type == 'response'">
		<input type="hidden" name="responseHeaderJSON" :value="JSON.stringify(responseHeaderRef)"/>
		<table class="ui table definition selectable">
			<prior-checkbox :v-config="responseHeaderRef"></prior-checkbox>
		</table>
		<submit-btn></submit-btn>
	</div>
	
	<div v-if="((!vIsLocation && !vIsGroup) || responseHeaderRef.isPrior) && type == 'response'">
		<div v-if="vHasGroupResponseConfig">
        	<div class="margin"></div>
        	<warning-message>由于已经在当前<a :href="vGroupSettingUrl + '#response'">网站分组</a>中进行了对应的配置，在这里的配置将不会生效。</warning-message>
    	</div>
    	<div :class="{'opacity-mask': vHasGroupResponseConfig}">
			<h4>设置响应报头 &nbsp; <a href="" @click.prevent="addSettingHeader(vResponseHeaderPolicy.id)" style="font-size: 0.8em">[添加新报头]</a></h4>
			<p class="comment" style="margin-top: 0; padding-top: 0">将会覆盖已有的同名报头。</p>
			<p class="comment" v-if="responseSettingHeaders.length == 0">暂时还没有自定义报头。</p>
			<table class="ui table selectable celled" v-if="responseSettingHeaders.length > 0">
				<thead>
					<tr>
						<th>名称</th>
						<th>值</th>
						<th class="two op">操作</th>
					</tr>
				</thead>
				<tbody v-for="header in responseSettingHeaders">
					<tr>
						<td class="five wide">
							<a href="" @click.prevent="updateSettingPopup(vResponseHeaderPolicy.id, header.id)">{{header.name}} <i class="icon expand small"></i></a>
							<div>
								<span v-if="header.status != null && header.status.codes != null && !header.status.always"><grey-label v-for="code in header.status.codes" :key="code">{{code}}</grey-label></span>
								<span v-if="header.methods != null && header.methods.length > 0"><grey-label v-for="method in header.methods" :key="method">{{method}}</grey-label></span>
								<span v-if="header.domains != null && header.domains.length > 0"><grey-label v-for="domain in header.domains" :key="domain">{{domain}}</grey-label></span>
								<grey-label v-if="header.shouldAppend">附加</grey-label>
								<grey-label v-if="header.disableRedirect">跳转禁用</grey-label>
								<grey-label v-if="header.shouldReplace && header.replaceValues != null && header.replaceValues.length > 0">替换</grey-label>
							</div>
							
							<!-- CORS -->
							<div v-if="header.name == 'Access-Control-Allow-Origin' && header.value == '*'">
								<span class="red small">建议使用当前页面下方的"CORS自适应跨域"功能代替Access-Control-*-*相关报头。</span>
							</div>
						</td>
						<td>{{header.value}}</td>
						<td><a href="" @click.prevent="updateSettingPopup(vResponseHeaderPolicy.id, header.id)">修改</a> &nbsp; <a href="" @click.prevent="deleteHeader(vResponseHeaderPolicy.id, 'setHeader', header.id)">删除</a> </td>
					</tr>
				</tbody>
			</table>
			
			<h4>其他设置</h4>
			
			<table class="ui table definition selectable">
				<tbody>
					<tr>
						<td class="title">删除报头 <tip-icon content="可以通过此功能删除响应报文中不需要的报头"></tip-icon></td>
						<td>
							<div v-if="responseDeletingHeaders.length > 0">
								<div class="ui label small basic" v-for="headerName in responseDeletingHeaders">{{headerName}} &nbsp; <a href=""><i class="icon remove small" title="删除" @click.prevent="deleteDeletingHeader(vResponseHeaderPolicy.id, headerName)"></i></a></div>
								<div class="ui divider" ></div>
							</div>
							<button class="ui button small" type="button" @click.prevent="addDeletingHeader(vResponseHeaderPolicy.id, 'response')">+</button>
						</td>
					</tr>
					<tr>
						<td>非标报头 <tip-icon content="可以通过此功能设置响应报文中非标准的报头，比如hello_world"></tip-icon></td>
						<td>
							<div v-if="responseNonStandardHeaders.length > 0">
								<div class="ui label small basic" v-for="headerName in responseNonStandardHeaders">{{headerName}} &nbsp; <a href=""><i class="icon remove small" title="删除" @click.prevent="deleteNonStandardHeader(vResponseHeaderPolicy.id, headerName)"></i></a></div>
								<div class="ui divider" ></div>
							</div>
							<button class="ui button small" type="button" @click.prevent="addNonStandardHeader(vResponseHeaderPolicy.id, 'response')">+</button>
						</td>
					</tr>
					<tr>
						<td class="title">CORS自适应跨域</td>
						<td>
							<span v-if="responseCORS.isOn" class="green">已启用</span><span class="disabled" v-else="">未启用</span> &nbsp; <a href="" @click.prevent="updateCORS(vResponseHeaderPolicy.id)">[修改]</a>
							<p class="comment"><span v-if="!responseCORS.isOn">启用后，服务器可以</span><span v-else>服务器会</span>自动生成<code-label>Access-Control-*-*</code-label>相关的报头。</p>
						</td>
					</tr>
				</tbody>
			</table>
		</div>		
	</div>
	<div class="margin"></div>
</div>`
})

Vue.component("http-header-assistant", {
	props: ["v-type", "v-value"],
	mounted: function () {
		let that = this
		Tea.action("/servers/headers/options?type=" + this.vType)
			.post()
			.success(function (resp) {
				that.allHeaders = resp.data.headers
			})
	},
	data: function () {
		return {
			allHeaders: [],
			matchedHeaders: [],

			selectedHeaderName: ""
		}
	},
	watch: {
		vValue: function (v) {
			if (v != this.selectedHeaderName) {
				this.selectedHeaderName = ""
			}

			if (v.length == 0) {
				this.matchedHeaders = []
				return
			}
			this.matchedHeaders = this.allHeaders.filter(function (header) {
				return teaweb.match(header, v)
			}).slice(0, 10)
		}
	},
	methods: {
		select: function (header) {
			this.$emit("select", header)
			this.selectedHeaderName = header
		}
	},
	template: `<span v-if="selectedHeaderName.length == 0">
	<a href="" v-for="header in matchedHeaders" class="ui label basic tiny blue" style="font-weight: normal; margin-bottom: 0.3em" @click.prevent="select(header)">{{header}}</a>
	<span v-if="matchedHeaders.length > 0">&nbsp; &nbsp;</span>
</span>`
})

Vue.component("http-firewall-policy-selector", {
	props: ["v-http-firewall-policy"],
	mounted: function () {
		let that = this
		Tea.action("/servers/components/waf/count")
			.post()
			.success(function (resp) {
				that.count = resp.data.count
			})
	},
	data: function () {
		let firewallPolicy = this.vHttpFirewallPolicy
		return {
			count: 0,
			firewallPolicy: firewallPolicy
		}
	},
	methods: {
		remove: function () {
			this.firewallPolicy = null
		},
		select: function () {
			let that = this
			teaweb.popup("/servers/components/waf/selectPopup", {
				callback: function (resp) {
					that.firewallPolicy = resp.data.firewallPolicy
				}
			})
		},
		create: function () {
			let that = this
			teaweb.popup("/servers/components/waf/createPopup", {
				height: "26em",
				callback: function (resp) {
					that.firewallPolicy = resp.data.firewallPolicy
				}
			})
		}
	},
	template: `<div>
	<div v-if="firewallPolicy != null" class="ui label basic">
		<input type="hidden" name="httpFirewallPolicyId" :value="firewallPolicy.id"/>
		{{firewallPolicy.name}} &nbsp; <a :href="'/servers/components/waf/policy?firewallPolicyId=' + firewallPolicy.id" target="_blank" title="修改"><i class="icon pencil small"></i></a>&nbsp; <a href="" @click.prevent="remove()" title="删除"><i class="icon remove small"></i></a>
	</div>
	<div v-if="firewallPolicy == null">
		<span v-if="count > 0"><a href="" @click.prevent="select">[选择已有策略]</a> &nbsp; &nbsp; </span><a href="" @click.prevent="create">[创建新策略]</a>
	</div>
</div>`
})

Vue.component("http-cors-header-config-box", {
	props: ["value"],
	data: function () {
		let config = this.value
		if (config == null) {
			config = {
				isOn: false,
				allowMethods: [],
				allowOrigin: "",
				allowCredentials: true,
				exposeHeaders: [],
				maxAge: 0,
				requestHeaders: [],
				requestMethod: "",
				optionsMethodOnly: false
			}
		}
		if (config.allowMethods == null) {
			config.allowMethods = []
		}
		if (config.exposeHeaders == null) {
			config.exposeHeaders = []
		}

		let maxAgeSecondsString = config.maxAge.toString()
		if (maxAgeSecondsString == "0") {
			maxAgeSecondsString = ""
		}

		return {
			config: config,

			maxAgeSecondsString: maxAgeSecondsString,

			moreOptionsVisible: false
		}
	},
	watch: {
		maxAgeSecondsString: function (v) {
			let seconds = parseInt(v)
			if (isNaN(seconds)) {
				seconds = 0
			}
			this.config.maxAge = seconds
		}
	},
	methods: {
		changeMoreOptions: function (visible) {
			this.moreOptionsVisible = visible
		},
		addDefaultAllowMethods: function () {
			let that = this
			let defaultMethods = ["PUT", "GET", "POST", "DELETE", "HEAD", "OPTIONS", "PATCH"]
			defaultMethods.forEach(function (method) {
				if (!that.config.allowMethods.$contains(method)) {
					that.config.allowMethods.push(method)
				}
			})
		}
	},
	template: `<div>
	<input type="hidden" name="corsJSON" :value="JSON.stringify(config)"/>
	<table class="ui table definition selectable">
		<tbody>
			<tr>
				<td class="title">启用CORS自适应跨域</td>
				<td>
					<checkbox v-model="config.isOn"></checkbox>
					<p class="comment">启用后，自动在响应报头中增加对应的<code-label>Access-Control-*</code-label>相关内容。</p>
				</td>
			</tr>
		</tbody>
		<tbody v-show="config.isOn">
			<tr>
				<td colspan="2"><more-options-indicator @change="changeMoreOptions"></more-options-indicator></td>
			</tr>
		</tbody>
		<tbody v-show="config.isOn && moreOptionsVisible">
			<tr>
				<td>允许的请求方法列表</td>
				<td>
					<http-methods-box :v-methods="config.allowMethods"></http-methods-box>
					<p class="comment"><a href="" @click.prevent="addDefaultAllowMethods">[添加默认]</a>。<code-label>Access-Control-Allow-Methods</code-label>值设置。所访问资源允许使用的方法列表，不设置则表示默认为<code-label>PUT</code-label>、<code-label>GET</code-label>、<code-label>POST</code-label>、<code-label>DELETE</code-label>、<code-label>HEAD</code-label>、<code-label>OPTIONS</code-label>、<code-label>PATCH</code-label>。</p>
				</td>
			</tr>
			<tr>
				<td>预检结果缓存时间</td>
				<td>
					<div class="ui input right labeled">
						<input type="text" style="width: 6em" maxlength="6" v-model="maxAgeSecondsString"/>
						<span class="ui label">秒</span>
					</div>
					<p class="comment"><code-label>Access-Control-Max-Age</code-label>值设置。预检结果缓存时间，0或者不填表示使用浏览器默认设置。注意每个浏览器有不同的缓存时间上限。</p>
				</td>
			</tr>
			<tr>
				<td>允许服务器暴露的报头</td>
				<td>
					<values-box :v-values="config.exposeHeaders"></values-box>
					<p class="comment"><code-label>Access-Control-Expose-Headers</code-label>值设置。允许服务器暴露的报头，请注意报头的大小写。</p>
				</td>
			</tr>
			<tr>
				<td>实际请求方法</td>
				<td>
					<input type="text" v-model="config.requestMethod"/>
					<p class="comment"><code-label>Access-Control-Request-Method</code-label>值设置。实际请求服务器时使用的方法，比如<code-label>POST</code-label>。</p>
				</td>
			</tr>
			<tr>
				<td>仅OPTIONS有效</td>
				<td>
					<checkbox v-model="config.optionsMethodOnly"></checkbox>
					<p class="comment">选中后，表示当前CORS设置仅在OPTIONS方法请求时有效。</p>
				</td>
			</tr>
		</tbody>
	</table>
	<div class="margin"></div>
</div>`
})

Vue.component("http-webp-config-box", {
	props: ["v-webp-config", "v-is-location", "v-is-group", "v-require-cache"],
	data: function () {
		let config = this.vWebpConfig
		if (config == null) {
			config = {
				isPrior: false,
				isOn: false,
				minLength: {count: 0, "unit": "kb"},
				maxLength: {count: 0, "unit": "kb"},
				mimeTypes: ["image/png", "image/jpeg", "image/bmp", "image/x-ico"],
				extensions: [".png", ".jpeg", ".jpg", ".bmp", ".ico"],
				conds: null
			}
		}

		if (config.mimeTypes == null) {
			config.mimeTypes = []
		}
		if (config.extensions == null) {
			config.extensions = []
		}

		return {
			config: config,
			moreOptionsVisible: false
		}
	},
	methods: {
		isOn: function () {
			return ((!this.vIsLocation && !this.vIsGroup) || this.config.isPrior) && this.config.isOn
		},
		changeExtensions: function (values) {
			values.forEach(function (v, k) {
				if (v.length > 0 && v[0] != ".") {
					values[k] = "." + v
				}
			})
			this.config.extensions = values
		},
		changeMimeTypes: function (values) {
			this.config.mimeTypes = values
		},
		changeAdvancedVisible: function () {
			this.moreOptionsVisible = !this.moreOptionsVisible
		},
		changeConds: function (conds) {
			this.config.conds = conds
		}
	},
	template: `<div>
	<input type="hidden" name="webpJSON" :value="JSON.stringify(config)"/>
	<table class="ui table definition selectable">
		<prior-checkbox :v-config="config" v-if="vIsLocation || vIsGroup"></prior-checkbox>
		<tbody v-show="(!vIsLocation && !vIsGroup) || config.isPrior">
			<tr>
				<td class="title">启用WebP压缩</td>
				<td>
					<div class="ui checkbox">
						<input type="checkbox" value="1" v-model="config.isOn"/>
						<label></label>
					</div>
					<p class="comment">选中后表示开启自动WebP压缩；图片的宽和高均不能超过16383像素<span v-if="vRequireCache">；只有满足缓存条件的图片内容才会被转换</span>。</p>
				</td>
			</tr>
		</tbody>
		<more-options-tbody @change="changeAdvancedVisible" v-if="isOn()"></more-options-tbody>
		<tbody v-show="isOn() && moreOptionsVisible">
			<tr>
				<td>支持的扩展名</td>
				<td>
					<values-box :values="config.extensions" @change="changeExtensions" placeholder="比如 .html"></values-box>
					<p class="comment">含有这些扩展名的URL将会被转成WebP，不区分大小写。</p>
				</td>
			</tr>
			<tr>
				<td>支持的MimeType</td>
				<td>
					<values-box :values="config.mimeTypes" @change="changeMimeTypes" placeholder="比如 text/*"></values-box>
					<p class="comment">响应的Content-Type里包含这些MimeType的内容将会被转成WebP。</p>
				</td>
			</tr>
			<tr>
				<td>内容最小长度</td>
				<td>
					<size-capacity-box :v-name="'minLength'" :v-value="config.minLength" :v-unit="'kb'"></size-capacity-box>
					<p class="comment">0表示不限制，内容长度从文件尺寸或Content-Length中获取。</p>
				</td>
			</tr>
			<tr>
				<td>内容最大长度</td>
				<td>
					<size-capacity-box :v-name="'maxLength'" :v-value="config.maxLength" :v-unit="'mb'"></size-capacity-box>
					<p class="comment">0表示不限制，内容长度从文件尺寸或Content-Length中获取。</p>
				</td>
			</tr>
			<tr>
				<td>匹配条件</td>
				<td>
					<http-request-conds-box :v-conds="config.conds" @change="changeConds"></http-request-conds-box>
	</td>
			</tr>
		</tbody>
	</table>			
	<div class="ui margin"></div>
</div>`
})

Vue.component("server-config-copy-link", {
	props: ["v-server-id", "v-config-code"],
	data: function () {
		return {
			serverId: this.vServerId,
			configCode: this.vConfigCode
		}
	},
	methods: {
		copy: function () {
			teaweb.popup("/servers/server/settings/copy?serverId=" + this.serverId + "&configCode=" + this.configCode, {
				height: "25em",
				callback: function () {
					teaweb.success("复制成功")
				}
			})
		}
	},
	template: `<a href=\"" class="item" @click.prevent="copy" style="padding-right:0"><span style="font-size: 0.8em">批量</span>&nbsp;<i class="icon copy small"></i></a>`
})

Vue.component("http-request-scripts-config-box", {
	props: ["vRequestScriptsConfig", "v-auditing-status", "v-is-location"],
	data: function () {
		let config = this.vRequestScriptsConfig
		if (config == null) {
			config = {}
		}

		return {
			config: config
		}
	},
	methods: {
		changeInitGroup: function (group) {
			this.config.initGroup = group
			this.$forceUpdate()
		},
		changeRequestGroup: function (group) {
			this.config.requestGroup = group
			this.$forceUpdate()
		}
	},
	template: `<div>
	<input type="hidden" name="requestScriptsJSON" :value="JSON.stringify(config)"/>
	<div class="margin"></div>
	<h4 style="margin-bottom: 0">请求初始化</h4>
	<p class="comment">在请求刚初始化时调用，此时自定义报头等尚未生效。</p>
	<div>
		<script-group-config-box :v-group="config.initGroup" :v-auditing-status="vAuditingStatus" @change="changeInitGroup" :v-is-location="vIsLocation"></script-group-config-box>
	</div>
	<h4 style="margin-bottom: 0">准备发送请求</h4>
	<p class="comment">在准备执行请求或者转发请求之前调用，此时自定义报头、源站等已准备好。</p>
	<div>
		<script-group-config-box :v-group="config.requestGroup" :v-auditing-status="vAuditingStatus" @change="changeRequestGroup" :v-is-location="vIsLocation"></script-group-config-box>
	</div>
	<div class="margin"></div>
</div>`
})

Vue.component("http-pages-and-shutdown-box", {
	props: ["v-enable-global-pages", "v-pages", "v-shutdown-config", "v-is-location"],
	data: function () {
		let pages = []
		if (this.vPages != null) {
			pages = this.vPages
		}
		let shutdownConfig = {
			isPrior: false,
			isOn: false,
			bodyType: "html",
			url: "",
			body: "",
			status: 0
		}
		if (this.vShutdownConfig != null) {
			if (this.vShutdownConfig.body == null) {
				this.vShutdownConfig.body = ""
			}
			if (this.vShutdownConfig.bodyType == null) {
				this.vShutdownConfig.bodyType = "html"
			}
			shutdownConfig = this.vShutdownConfig
		}

		let shutdownStatus = ""
		if (shutdownConfig.status > 0) {
			shutdownStatus = shutdownConfig.status.toString()
		}

		return {
			pages: pages,
			shutdownConfig: shutdownConfig,
			shutdownStatus: shutdownStatus,
			enableGlobalPages: this.vEnableGlobalPages
		}
	},
	watch: {
		shutdownStatus: function (status) {
			let statusInt = parseInt(status)
			if (!isNaN(statusInt) && statusInt > 0 && statusInt < 1000) {
				this.shutdownConfig.status = statusInt
			} else {
				this.shutdownConfig.status = 0
			}
		}
	},
	methods: {
		addPage: function () {
			let that = this
			teaweb.popup("/servers/server/settings/pages/createPopup", {
				height: "30em",
				callback: function (resp) {
					that.pages.push(resp.data.page)
					that.notifyChange()
				}
			})
		},
		updatePage: function (pageIndex, pageId) {
			let that = this
			teaweb.popup("/servers/server/settings/pages/updatePopup?pageId=" + pageId, {
				height: "30em",
				callback: function (resp) {
					Vue.set(that.pages, pageIndex, resp.data.page)
					that.notifyChange()
				}
			})
		},
		removePage: function (pageIndex) {
			let that = this
			teaweb.confirm("确定要删除此自定义页面吗？", function () {
				that.pages.$remove(pageIndex)
				that.notifyChange()
			})
		},
		addShutdownHTMLTemplate: function () {
			this.shutdownConfig.body = `<!DOCTYPE html>
<html lang="en">
<head>
\t<title>升级中</title>
\t<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
\t<style>
\t\taddress { line-height: 1.8; }
\t</style>
</head>
<body>

<h1>网站升级中</h1>
<p>为了给您提供更好的服务，我们正在升级网站，请稍后重新访问。</p>

<address>Connection: \${remoteAddr} (Client) -&gt; \${serverAddr} (Server)</address>
<address>Request ID: \${requestId}</address>

</body>
</html>`
		},
		notifyChange: function () {
			let parent = this.$el.parentNode
			while (true) {
				if (parent == null) {
					break
				}
				if (parent.tagName == "FORM") {
					break
				}
				parent = parent.parentNode
			}
			if (parent != null) {
				setTimeout(function () {
					Tea.runActionOn(parent)
				}, 100)
			}
		}
	},
	template: `<div>
<input type="hidden" name="pagesJSON" :value="JSON.stringify(pages)"/>
<input type="hidden" name="shutdownJSON" :value="JSON.stringify(shutdownConfig)"/>

<h4 style="margin-bottom: 0.5em">自定义页面</h4>

<p class="comment" style="padding-top: 0; margin-top: 0">根据响应状态码返回一些自定义页面，比如404，500等错误页面。</p>

<div v-if="pages.length > 0">
	<table class="ui table selectable celled">
		<thead>
			<tr>
				<th class="two wide">响应状态码</th>
				<th>页面类型</th>
				<th class="two wide">新状态码</th>
				<th>例外URL</th>
				<th>限制URL</th>
				<th class="two op">操作</th>
			</tr>	
		</thead>
		<tr v-for="(page,index) in pages">
			<td>
				<a href="" @click.prevent="updatePage(index, page.id)">
					<span v-if="page.status != null && page.status.length == 1">{{page.status[0]}}</span>
					<span v-else>{{page.status}}</span>
					
					<i class="icon expand small"></i>
				</a>
			</td>
			<td style="word-break: break-all">
				<div v-if="page.bodyType == 'url'">
					{{page.url}}
					<div>
						<grey-label>读取URL</grey-label>
					</div>
				</div>
				<div v-if="page.bodyType == 'redirectURL'">
					{{page.url}}
					<div>
						<grey-label>跳转URL</grey-label>	
						<grey-label v-if="page.newStatus > 0">{{page.newStatus}}</grey-label>
					</div>
				</div>
				<div v-if="page.bodyType == 'html'">
					[HTML内容]
					<div>
						<grey-label v-if="page.newStatus > 0">{{page.newStatus}}</grey-label>
					</div>
				</div>
			</td>
			<td>
				<span v-if="page.newStatus > 0">{{page.newStatus}}</span>
				<span v-else class="disabled">保持</span>	
			</td>
			<td>
				<div v-if="page.exceptURLPatterns != null && page.exceptURLPatterns">
					<span v-for="urlPattern in page.exceptURLPatterns" class="ui basic label small">{{urlPattern.pattern}}</span>
				</div>
				<span v-else class="disabled">-</span>
			</td>
			<td>
				<div v-if="page.onlyURLPatterns != null && page.onlyURLPatterns">
					<span v-for="urlPattern in page.onlyURLPatterns" class="ui basic label small">{{urlPattern.pattern}}</span>
				</div>
				<span v-else class="disabled">-</span>
			</td>
			<td>
				<a href="" title="修改" @click.prevent="updatePage(index, page.id)">修改</a> &nbsp; 
				<a href="" title="删除" @click.prevent="removePage(index)">删除</a>
			</td>
		</tr>
	</table>
</div>
<div style="margin-top: 1em">
	<button class="ui button small" type="button" @click.prevent="addPage()">+添加自定义页面</button>
</div>

<h4 style="margin-top: 2em;">临时关闭页面</h4>
<p class="comment" style="margin-top: 0; padding-top: 0">开启临时关闭页面时，所有请求都会直接显示此页面。可用于临时升级网站或者禁止用户访问某个网页。</p>	
<div>
	<table class="ui table selectable definition">
		<prior-checkbox :v-config="shutdownConfig" v-if="vIsLocation"></prior-checkbox>
		<tbody v-show="!vIsLocation || shutdownConfig.isPrior">
			<tr>
				<td class="title">启用临时关闭网站</td>
				<td>
					<div class="ui checkbox">
						<input type="checkbox" value="1" v-model="shutdownConfig.isOn" />
						<label></label>
					</div>
					<p class="comment">选中后，表示临时关闭当前网站，并显示自定义内容。</p>
				</td>
			</tr>
		</tbody>
		<tbody v-show="(!vIsLocation || shutdownConfig.isPrior) && shutdownConfig.isOn">
			<tr>
				<td>显示内容类型 *</td>
				<td>
					<select class="ui dropdown auto-width" v-model="shutdownConfig.bodyType">
						<option value="html">HTML</option>
						<option value="url">读取URL</option>
						<option value="redirectURL">跳转URL</option>
					</select>
				</td>
			</tr>
			<tr v-if="shutdownConfig.bodyType == 'url'">
				<td class="title">显示页面URL *</td>
				<td>
					<input type="text" v-model="shutdownConfig.url" placeholder="类似于 https://example.com/page.html"/>
					<p class="comment">将从此URL中读取内容。</p>
				</td>
			</tr>
			<tr v-if="shutdownConfig.bodyType == 'redirectURL'">
				<td class="title">跳转到URL *</td>
				<td>
					<input type="text" v-model="shutdownConfig.url" placeholder="类似于 https://example.com/page.html"/>
					 <p class="comment">将会跳转到此URL。</p>
				</td>
			</tr>
			<tr v-show="shutdownConfig.bodyType == 'html'">
				<td>显示页面HTML *</td>
				<td>
					<textarea name="body" ref="shutdownHTMLBody" v-model="shutdownConfig.body"></textarea>
					<p class="comment"><a href="" @click.prevent="addShutdownHTMLTemplate">[使用模板]</a>。填写页面的HTML内容，支持请求变量。</p>
				</td>
			</tr>
			<tr>
				<td>状态码</td>
				<td><input type="text" size="3" maxlength="3" name="shutdownStatus" style="width:5.2em" placeholder="状态码" v-model="shutdownStatus"/></td>
			</tr>
		</tbody>
	</table>
</div>

<h4 style="margin-top: 2em;">其他设置</h4>
<table class="ui table definition selectable">
	<tr>
		<td class="title">启用系统自定义页面</td>
		<td>
			<checkbox name="enableGlobalPages" v-model="enableGlobalPages"></checkbox>
			<p class="comment">选中后，表示如果当前网站没有自定义页面，则尝试使用系统对应的自定义页面。</p>
		</td>
	</tr>
</table>
<div class="ui margin"></div>

</div>`
})

// 显示WAF规则的标签
Vue.component("http-firewall-rule-label", {
	props: ["v-rule"],
	data: function () {
		return {
			rule: this.vRule
		}
	},
	methods: {
		showErr: function (err) {
			teaweb.popupTip("规则校验错误，请修正：<span class=\"red\">"  + teaweb.encodeHTML(err) + "</span>")
		},
		calculateParamName: function (param) {
			let paramName = ""
			if (param != null) {
				window.WAF_RULE_CHECKPOINTS.forEach(function (checkpoint) {
					if (param == "${" + checkpoint.prefix + "}" || param.startsWith("${" + checkpoint.prefix + ".")) {
						paramName = checkpoint.name
					}
				})
			}
			return paramName
		},
		calculateParamDescription: function (param) {
			let paramName = ""
			let paramDescription = ""
			if (param != null) {
				window.WAF_RULE_CHECKPOINTS.forEach(function (checkpoint) {
					if (param == "${" + checkpoint.prefix + "}" || param.startsWith("${" + checkpoint.prefix + ".")) {
						paramName = checkpoint.name
						paramDescription = checkpoint.description
					}
				})
			}
			return paramName + ": " + paramDescription
		},
		operatorName: function (operatorCode) {
			let operatorName = operatorCode
			if (typeof (window.WAF_RULE_OPERATORS) != null) {
				window.WAF_RULE_OPERATORS.forEach(function (v) {
					if (v.code == operatorCode) {
						operatorName = v.name
					}
				})
			}

			return operatorName
		},
		operatorDescription: function (operatorCode) {
			let operatorName = operatorCode
			let operatorDescription = ""
			if (typeof (window.WAF_RULE_OPERATORS) != null) {
				window.WAF_RULE_OPERATORS.forEach(function (v) {
					if (v.code == operatorCode) {
						operatorName = v.name
						operatorDescription = v.description
					}
				})
			}

			return operatorName + ": " + operatorDescription
		},
		operatorDataType: function (operatorCode) {
			let operatorDataType = "none"
			if (typeof (window.WAF_RULE_OPERATORS) != null) {
				window.WAF_RULE_OPERATORS.forEach(function (v) {
					if (v.code == operatorCode) {
						operatorDataType = v.dataType
					}
				})
			}

			return operatorDataType
		},
		isEmptyString: function (v) {
			return typeof v == "string" && v.length == 0
		}
	},
	template: `<div>
	<div class="ui label small basic" style="line-height: 1.5">
		{{rule.name}} <span :title="calculateParamDescription(rule.param)" class="hover">{{calculateParamName(rule.param)}}<span class="small grey"> {{rule.param}}</span></span>

		<!-- cc2 -->
		<span v-if="rule.param == '\${cc2}'">
			{{rule.checkpointOptions.period}}秒内请求数
		</span>

		<!-- refererBlock -->
		<span v-if="rule.param == '\${refererBlock}'">
			<span v-if="rule.checkpointOptions.allowDomains != null && rule.checkpointOptions.allowDomains.length > 0">允许{{rule.checkpointOptions.allowDomains}}</span>
			<span v-if="rule.checkpointOptions.denyDomains != null && rule.checkpointOptions.denyDomains.length > 0">禁止{{rule.checkpointOptions.denyDomains}}</span>
		</span>

		<span v-else>
			<span v-if="rule.paramFilters != null && rule.paramFilters.length > 0" v-for="paramFilter in rule.paramFilters"> | {{paramFilter.code}}</span> 
		<span class="hover" :class="{dash:!rule.isComposed && rule.isCaseInsensitive}" :title="operatorDescription(rule.operator) + ((!rule.isComposed && rule.isCaseInsensitive) ? '\\n[大小写不敏感] ':'')">&lt;{{operatorName(rule.operator)}}&gt;</span> 
			<span v-if="!isEmptyString(rule.value)" class="hover">{{rule.value}}</span>
			<span v-else-if="operatorDataType(rule.operator) != 'none'" class="disabled" style="font-weight: normal" title="空字符串">[空]</span>
		</span>
		
		<!-- description -->
		<span v-if="rule.description != null && rule.description.length > 0" class="grey small">（{{rule.description}}）</span>
		
		<a href="" v-if="rule.err != null && rule.err.length > 0" @click.prevent="showErr(rule.err)" style="color: #db2828; opacity: 1; border-bottom: 1px #db2828 dashed; margin-left: 0.5em">规则错误</a>
	</div>
</div>`
})

Vue.component("http-access-log-config-box", {
	props: ["v-access-log-config", "v-fields", "v-default-field-codes", "v-access-log-policies", "v-is-location", "v-is-group"],
	data: function () {
		let that = this

		// 初始化
		setTimeout(function () {
			that.changeFields()
			that.changePolicy()
		}, 100)

		let accessLog = {
			isPrior: false,
			isOn: false,
			fields: [],
			status1: true,
			status2: true,
			status3: true,
			status4: true,
			status5: true,

			storageOnly: false,
			storagePolicies: [],

            firewallOnly: false
		}
		if (this.vAccessLogConfig != null) {
			accessLog = this.vAccessLogConfig
		}

		this.vFields.forEach(function (v) {
			if (that.vAccessLogConfig == null) { // 初始化默认值
				v.isChecked = that.vDefaultFieldCodes.$contains(v.code)
			} else {
				v.isChecked = accessLog.fields.$contains(v.code)
			}
		})
		this.vAccessLogPolicies.forEach(function (v) {
			v.isChecked = accessLog.storagePolicies.$contains(v.id)
		})

		return {
			accessLog: accessLog,
			showAdvancedOptions: false
		}
	},
	methods: {
		changeFields: function () {
			this.accessLog.fields = this.vFields.filter(function (v) {
				return v.isChecked
			}).map(function (v) {
				return v.code
			})
		},
		changePolicy: function () {
			this.accessLog.storagePolicies = this.vAccessLogPolicies.filter(function (v) {
				return v.isChecked
			}).map(function (v) {
				return v.id
			})
		},
		changeAdvanced: function (v) {
			this.showAdvancedOptions = v
		}
	},
	template: `<div>
	<input type="hidden" name="accessLogJSON" :value="JSON.stringify(accessLog)"/>
	<table class="ui table definition selectable">
		<prior-checkbox :v-config="accessLog" v-if="vIsLocation"></prior-checkbox>
		<tbody v-show="!vIsLocation || accessLog.isPrior">
			<tr>
				<td class="title">启用访问日志</td>
				<td>
					<div class="ui checkbox">
						<input type="checkbox" v-model="accessLog.isOn"/>
						<label></label>
					</div>
				</td>
			</tr>
		</tbody>
		<tbody v-show="((!vIsLocation && !vIsGroup) || accessLog.isPrior) && accessLog.isOn">
			<tr>
				<td colspan="2"><more-options-indicator @change="changeAdvanced"></more-options-indicator></td>
			</tr>
		</tbody>
		<tbody  v-show="(!vIsLocation || accessLog.isPrior) && accessLog.isOn && showAdvancedOptions">
			<tr>
				<td>要存储的访问日志字段</td>
				<td>
					<div class="ui checkbox" v-for="field in vFields" style="width:10em;margin-bottom:0.8em">
						<input type="checkbox" v-model="field.isChecked" @change="changeFields"/>
						<label>{{field.name}}</label>
					</div>
				</td>
			</tr>
			<tr>
				<td>要存储的访问日志状态码</td>
				<td>
					<div class="ui checkbox" style="width:3.5em">
						<input type="checkbox" v-model="accessLog.status1"/>
						<label>1xx</label>
					</div>
					<div class="ui checkbox" style="width:3.5em">
						<input type="checkbox" v-model="accessLog.status2"/>
						<label>2xx</label>
					</div>
					<div class="ui checkbox" style="width:3.5em">
						<input type="checkbox" v-model="accessLog.status3"/>
						<label>3xx</label>
					</div>
					<div class="ui checkbox" style="width:3.5em">
						<input type="checkbox" v-model="accessLog.status4"/>
						<label>4xx</label>
					</div>
					<div class="ui checkbox" style="width:3.5em">
						<input type="checkbox" v-model="accessLog.status5"/>
						<label>5xx</label>
					</div>
				</td>
			</tr>
			<tr v-show="vAccessLogPolicies.length > 0">
				<td>选择输出的日志策略</td>
				<td>
					<span class="disabled" v-if="vAccessLogPolicies.length == 0">暂时还没有缓存策略。</span>
					<div v-if="vAccessLogPolicies.length > 0">
						<div class="ui checkbox" v-for="policy in vAccessLogPolicies" style="width:10em;margin-bottom:0.8em">
							<input type="checkbox" v-model="policy.isChecked" @change="changePolicy" />
							<label>{{policy.name}}</label>
						</div>
					</div>
				</td>
			</tr>
			<tr v-show="vAccessLogPolicies.length > 0">
				<td>是否只输出到日志策略</td>
				<td>
					<div class="ui checkbox">
						<input type="checkbox" v-model="accessLog.storageOnly"/>
						<label></label>
					</div>
					<p class="comment">选中表示只输出日志到日志策略，而停止默认的日志存储。</p>
				</td>
			</tr>
			<tr>
			    <td>只记录WAF相关日志</td>
			    <td>
			        <checkbox v-model="accessLog.firewallOnly"></checkbox>
			        <p class="comment">选中后只记录WAF相关的日志。</p>
                </td>
            </tr>
		</tbody>
	</table>
	<div class="margin"></div>
</div>`
})

Vue.component("http-cache-config-box", {
	props: ["v-cache-config", "v-is-location", "v-is-group", "v-cache-policy", "v-web-id"],
	data: function () {
		let cacheConfig = this.vCacheConfig
		if (cacheConfig == null) {
			cacheConfig = {
				isPrior: false,
				isOn: false,
				addStatusHeader: true,
				addAgeHeader: false,
				enableCacheControlMaxAge: false,
				cacheRefs: [],
				purgeIsOn: false,
				purgeKey: "",
				disablePolicyRefs: false
			}
		}
		if (cacheConfig.cacheRefs == null) {
			cacheConfig.cacheRefs = []
		}

		let maxBytes = null
		if (this.vCachePolicy != null && this.vCachePolicy.maxBytes != null) {
			maxBytes = this.vCachePolicy.maxBytes
		}

		// key
		if (cacheConfig.key == null) {
			// use Vue.set to activate vue events
			Vue.set(cacheConfig, "key", {
				isOn: false,
				scheme: "https",
				host: ""
			})
		}

		return {
			cacheConfig: cacheConfig,
			moreOptionsVisible: false,
			enablePolicyRefs: !cacheConfig.disablePolicyRefs,
			maxBytes: maxBytes,

			searchBoxVisible: false,
			searchKeyword: "",

			keyOptionsVisible: false
		}
	},
	watch: {
		enablePolicyRefs: function (v) {
			this.cacheConfig.disablePolicyRefs = !v
		},
		searchKeyword: function (v) {
			this.$refs.cacheRefsConfigBoxRef.search(v)
		}
	},
	methods: {
		isOn: function () {
			return ((!this.vIsLocation && !this.vIsGroup) || this.cacheConfig.isPrior) && this.cacheConfig.isOn
		},
		isPlus: function () {
			return true
		},
		generatePurgeKey: function () {
			let r = Math.random().toString() + Math.random().toString()
			let s = r.replace(/0\./g, "")
				.replace(/\./g, "")
			let result = ""
			for (let i = 0; i < s.length; i++) {
				result += String.fromCharCode(parseInt(s.substring(i, i + 1)) + ((Math.random() < 0.5) ? "a" : "A").charCodeAt(0))
			}
			this.cacheConfig.purgeKey = result
		},
		showMoreOptions: function () {
			this.moreOptionsVisible = !this.moreOptionsVisible
		},
		changeStale: function (stale) {
			this.cacheConfig.stale = stale
		},
		showSearchBox: function () {
			this.searchBoxVisible = !this.searchBoxVisible
			if (this.searchBoxVisible) {
				let that = this
				setTimeout(function () {
					that.$refs.searchBox.focus()
				})
			} else {
				this.searchKeyword = ""
			}
		}
	},
	template: `<div>
	<input type="hidden" name="cacheJSON" :value="JSON.stringify(cacheConfig)"/>
	<table class="ui table definition selectable">
		<prior-checkbox :v-config="cacheConfig" v-if="vIsLocation"></prior-checkbox>
		<tbody v-show="!vIsLocation || cacheConfig.isPrior">
			<tr>
				<td class="title">启用缓存</td>
				<td>
					<div class="ui checkbox">
						<input type="checkbox" v-model="cacheConfig.isOn"/>
						<label></label>
					</div>
				</td>
			</tr>
		</tbody>
		
		<tbody v-show="isOn() && !vIsGroup">
			<tr>
				<td>缓存主域名</td>
				<td>
					<div v-show="!cacheConfig.key.isOn">默认 &nbsp; <a href="" @click.prevent="keyOptionsVisible = !keyOptionsVisible"><span class="small">[修改]</span></a></div>
					<div v-show="cacheConfig.key.isOn">使用主域名：{{cacheConfig.key.scheme}}://{{cacheConfig.key.host}} &nbsp;  <a href="" @click.prevent="keyOptionsVisible = !keyOptionsVisible"><span class="small">[修改]</span></a></div>
					<div v-show="keyOptionsVisible" style="margin-top: 1em">
						<div class="ui divider"></div>
						<table class="ui table definition">
							<tr>
								<td class="title">启用主域名</td>
								<td><checkbox v-model="cacheConfig.key.isOn"></checkbox>
									<p class="comment">启用主域名后，所有缓存键值中的协议和域名部分都会修改为主域名，用来实现缓存不区分域名。</p>
								</td>
							</tr>	
							<tr v-show="cacheConfig.key.isOn">
								<td>主域名 *</td>
								<td>
									<div class="ui fields inline">
										<div class="ui field">
											<select class="ui dropdown" v-model="cacheConfig.key.scheme">
												<option value="https">https://</option>
												<option value="http">http://</option>
											</select>
										</div>
										<div class="ui field">
											<input type="text" v-model="cacheConfig.key.host" placeholder="example.com" @keyup.enter="keyOptionsVisible = false" @keypress.enter.prevent="1"/>
										</div>
									</div>
									<p class="comment">此域名<strong>必须</strong>是当前网站已绑定域名，在刷新缓存时也需要使用此域名。</p>
								</td>
							</tr>
						</table>
						<button class="ui button tiny" type="button" @click.prevent="keyOptionsVisible = false">完成</button>
					</div>
				</td>
			</tr>
		</tbody>
	
		<tbody v-show="isOn()">
			<tr>
				<td colspan="2">
					<a href="" @click.prevent="showMoreOptions"><span v-if="moreOptionsVisible">收起选项</span><span v-else>更多选项</span><i class="icon angle" :class="{up: moreOptionsVisible, down:!moreOptionsVisible}"></i></a>
				</td>
			</tr>
		</tbody>
		<tbody v-show="isOn() && moreOptionsVisible">
			<tr>
				<td>使用默认缓存条件</td>
				<td>	
					<checkbox v-model="enablePolicyRefs"></checkbox>
					<p class="comment">选中后使用系统中已经定义的默认缓存条件。</p>
				</td>
			</tr>
			<tr>
				<td>添加X-Cache报头</td>
				<td>
					<checkbox v-model="cacheConfig.addStatusHeader"></checkbox>
					<p class="comment">选中后自动在响应报头中增加<code-label>X-Cache: BYPASS|MISS|HIT|PURGE</code-label>；在浏览器端查看X-Cache值时请先禁用浏览器缓存，避免影响观察。</p>
				</td>
			</tr>
			<tr>
				<td>添加Age Header</td>
				<td>
					<checkbox v-model="cacheConfig.addAgeHeader"></checkbox>
					<p class="comment">选中后自动在响应Header中增加<code-label>Age: [存活时间秒数]</code-label>。</p>
				</td>
			</tr>
			<tr>
				<td>支持源站控制有效时间</td>
				<td>
					<checkbox v-model="cacheConfig.enableCacheControlMaxAge"></checkbox>
					<p class="comment">选中后表示支持源站在Header中设置的<code-label>Cache-Control: max-age=[有效时间秒数]</code-label>。</p>
				</td>
			</tr>
			<tr>
				<td class="color-border">允许PURGE</td>
				<td>
					<checkbox v-model="cacheConfig.purgeIsOn"></checkbox>
					<p class="comment">允许使用PURGE方法清除某个URL缓存。</p>
				</td>
			</tr>
			<tr v-show="cacheConfig.purgeIsOn">
				<td class="color-border">PURGE Key *</td>
				<td>
					<input type="text" maxlength="200" v-model="cacheConfig.purgeKey"/>
					<p class="comment"><a href="" @click.prevent="generatePurgeKey">[随机生成]</a>。需要在PURGE方法调用时加入<code-label>Edge-Purge-Key: {{cacheConfig.purgeKey}}</code-label> Header。只能包含字符、数字、下划线。</p>
				</td>
			</tr>
		</tbody>
	</table>	
	
	
	<div v-show="isOn()">
		<submit-btn></submit-btn>
		<div class="ui divider"></div>
	</div>
	
	<div v-show="isOn()">
		<h4 style="position: relative">缓存条件 &nbsp; <a href="" style="font-size: 0.8em" @click.prevent="$refs.cacheRefsConfigBoxRef.addRef(false)">[添加]</a> &nbsp; <a href="" style="font-size: 0.8em" @click.prevent="showSearchBox" v-show="!searchBoxVisible">[搜索]</a> 
			<div class="ui input small right labeled" style="position: absolute; top: -0.4em; margin-left: 0.5em; zoom: 0.9" v-show="searchBoxVisible">
				<input type="text" placeholder="搜索..." ref="searchBox"  @keypress.enter.prevent="1" @keydown.esc="showSearchBox" v-model="searchKeyword" size="20"/>
				<a href="" class="ui label blue" @click.prevent="showSearchBox"><i class="icon remove small"></i></a>
			</div>
		</h4>
		<http-cache-refs-config-box ref="cacheRefsConfigBoxRef"  :v-cache-config="cacheConfig" :v-cache-refs="cacheConfig.cacheRefs" :v-web-id="vWebId" :v-max-bytes="maxBytes"></http-cache-refs-config-box>
	</div>
	<div class="margin"></div>
</div>`
})

Vue.component("http-rewrite-rule-list", {
	props: ["v-web-id", "v-rewrite-rules"],
	mounted: function () {
		setTimeout(this.sort, 1000)
	},
	data: function () {
		let rewriteRules = this.vRewriteRules
		if (rewriteRules == null) {
			rewriteRules = []
		}
		return {
			rewriteRules: rewriteRules
		}
	},
	methods: {
		updateRewriteRule: function (rewriteRuleId) {
			teaweb.popup("/servers/server/settings/rewrite/updatePopup?webId=" + this.vWebId + "&rewriteRuleId=" + rewriteRuleId, {
				height: "26em",
				callback: function () {
					window.location.reload()
				}
			})
		},
		deleteRewriteRule: function (rewriteRuleId) {
			let that = this
			teaweb.confirm("确定要删除此重写规则吗？", function () {
				Tea.action("/servers/server/settings/rewrite/delete")
					.params({
						webId: that.vWebId,
						rewriteRuleId: rewriteRuleId
					})
					.post()
					.refresh()
			})
		},
		// 排序
		sort: function () {
			if (this.rewriteRules.length == 0) {
				return
			}
			let that = this
			sortTable(function (rowIds) {
				Tea.action("/servers/server/settings/rewrite/sort")
					.post()
					.params({
						webId: that.vWebId,
						rewriteRuleIds: rowIds
					})
					.success(function () {
						teaweb.success("保存成功")
					})
			})
		}
	},
	template: `<div>
	<div class="margin"></div>
	<p class="comment" v-if="rewriteRules.length == 0">暂时还没有重写规则。</p>
	<table class="ui table selectable" v-if="rewriteRules.length > 0" id="sortable-table">
		<thead>
			<tr>
				<th style="width:1em"></th>
				<th>匹配规则</th>
				<th>转发目标</th>
				<th>转发方式</th>
				<th class="two wide">状态</th>
				<th class="two op">操作</th>
			</tr>
		</thead>
		<tbody v-for="rule in rewriteRules" :v-id="rule.id">
			<tr>
				<td><i class="icon bars grey handle"></i></td>
				<td>{{rule.pattern}}
				<br/>
					<http-rewrite-labels-label class="ui label tiny" v-if="rule.isBreak">BREAK</http-rewrite-labels-label>
					<http-rewrite-labels-label class="ui label tiny" v-if="rule.mode == 'redirect' && rule.redirectStatus != 307">{{rule.redirectStatus}}</http-rewrite-labels-label>
					<http-rewrite-labels-label class="ui label tiny" v-if="rule.proxyHost.length > 0">Host: {{rule.proxyHost}}</http-rewrite-labels-label>
				</td>
				<td>{{rule.replace}}</td>
				<td>
					<span v-if="rule.mode == 'proxy'">隐式</span>
					<span v-if="rule.mode == 'redirect'">显示</span>
				</td>
				<td>
					<label-on :v-is-on="rule.isOn"></label-on>
				</td>
				<td>
					<a href="" @click.prevent="updateRewriteRule(rule.id)">修改</a> &nbsp;
					<a href="" @click.prevent="deleteRewriteRule(rule.id)">删除</a>
				</td>
			</tr>
		</tbody>
	</table>
	<p class="comment" v-if="rewriteRules.length > 0">拖动左侧的<i class="icon bars grey"></i>图标可以对重写规则进行排序。</p>

</div>`
})

Vue.component("http-rewrite-labels-label", {
	props: ["v-class"],
	template: `<span class="ui label tiny" :class="vClass" style="font-size:0.7em;padding:4px;margin-top:0.3em;margin-bottom:0.3em"><slot></slot></span>`
})

// 动作选择
Vue.component("http-firewall-actions-box", {
	props: ["v-actions", "v-firewall-policy", "v-action-configs", "v-group-type"],
	mounted: function () {
		let that = this
		Tea.action("/servers/iplists/levelOptions")
			.success(function (resp) {
				that.ipListLevels = resp.data.levels
			})
			.post()

		this.loadJS(function () {
			let box = document.getElementById("actions-box")
			Sortable.create(box, {
				draggable: ".label",
				handle: ".icon.handle",
				onStart: function () {
					that.cancel()
				},
				onUpdate: function (event) {
					let labels = box.getElementsByClassName("label")
					let newConfigs = []
					for (let i = 0; i < labels.length; i++) {
						let index = parseInt(labels[i].getAttribute("data-index"))
						newConfigs.push(that.configs[index])
					}
					that.configs = newConfigs
				}
			})
		})
	},
	data: function () {
		if (this.vFirewallPolicy.inbound == null) {
			this.vFirewallPolicy.inbound = {}
		}
		if (this.vFirewallPolicy.inbound.groups == null) {
			this.vFirewallPolicy.inbound.groups = []
		}

		if (this.vFirewallPolicy.outbound == null) {
			this.vFirewallPolicy.outbound = {}
		}
		if (this.vFirewallPolicy.outbound.groups == null) {
			this.vFirewallPolicy.outbound.groups = []
		}

		let id = 0
		let configs = []
		if (this.vActionConfigs != null) {
			configs = this.vActionConfigs
			configs.forEach(function (v) {
				v.id = (id++)
			})
		}

		var defaultPageBody = `<!DOCTYPE html>
<html lang="en">
<head>
\t<title>403 Forbidden</title>
\t<style>
\t\taddress { line-height: 1.8; }
\t</style>
</head>
<body>
<h1>403 Forbidden</h1>
<address>Connection: \${remoteAddr} (Client) -&gt; \${serverAddr} (Server)</address>
<address>Request ID: \${requestId}</address>
</body>
</html>`


		return {
			id: id,

			actions: this.vActions,
			configs: configs,
			isAdding: false,
			editingIndex: -1,

			action: null,
			actionCode: "",
			actionOptions: {},

			// IPList相关
			ipListLevels: [],

			// 动作参数
			allowScope: "global",

			blockTimeout: "",
			blockTimeoutMax: "",
			blockScope: "global",

			captchaLife: "",
			captchaMaxFails: "",
			captchaFailBlockTimeout: "",

			get302Life: "",

			post307Life: "",

			recordIPType: "black",
			recordIPLevel: "critical",
			recordIPTimeout: "",
			recordIPListId: 0,
			recordIPListName: "",

			tagTags: [],

			pageUseDefault: true,
			pageStatus: 403,
			pageBody: defaultPageBody,
			defaultPageBody: defaultPageBody,

			redirectStatus: 307,
			redirectURL: "",

			goGroupName: "",
			goGroupId: 0,
			goGroup: null,

			goSetId: 0,
			goSetName: "",

			jsCookieLife: "",
			jsCookieMaxFails: "",
			jsCookieFailBlockTimeout: "",

			statusOptions: [
				{"code": 301, "text": "Moved Permanently"},
				{"code": 308, "text": "Permanent Redirect"},
				{"code": 302, "text": "Found"},
				{"code": 303, "text": "See Other"},
				{"code": 307, "text": "Temporary Redirect"}
			]
		}
	},
	watch: {
		actionCode: function (code) {
			this.action = this.actions.$find(function (k, v) {
				return v.code == code
			})
			this.actionOptions = {}
		},
		allowScope: function (v) {
			this.actionOptions["scope"] = v
		},
		blockTimeout: function (v) {
			v = parseInt(v)
			if (isNaN(v)) {
				this.actionOptions["timeout"] = 0
			} else {
				this.actionOptions["timeout"] = v
			}
		},
		blockTimeoutMax: function (v) {
			v = parseInt(v)
			if (isNaN(v)) {
				this.actionOptions["timeoutMax"] = 0
			} else {
				this.actionOptions["timeoutMax"] = v
			}
		},
		blockScope: function (v) {
			this.actionOptions["scope"] = v
		},
		captchaLife: function (v) {
			v = parseInt(v)
			if (isNaN(v)) {
				this.actionOptions["life"] = 0
			} else {
				this.actionOptions["life"] = v
			}
		},
		captchaMaxFails: function (v) {
			v = parseInt(v)
			if (isNaN(v)) {
				this.actionOptions["maxFails"] = 0
			} else {
				this.actionOptions["maxFails"] = v
			}
		},
		captchaFailBlockTimeout: function (v) {
			v = parseInt(v)
			if (isNaN(v)) {
				this.actionOptions["failBlockTimeout"] = 0
			} else {
				this.actionOptions["failBlockTimeout"] = v
			}
		},
		get302Life: function (v) {
			v = parseInt(v)
			if (isNaN(v)) {
				this.actionOptions["life"] = 0
			} else {
				this.actionOptions["life"] = v
			}
		},
		post307Life: function (v) {
			v = parseInt(v)
			if (isNaN(v)) {
				this.actionOptions["life"] = 0
			} else {
				this.actionOptions["life"] = v
			}
		},
		recordIPType: function (v) {
			this.recordIPListId = 0
		},
		recordIPTimeout: function (v) {
			v = parseInt(v)
			if (isNaN(v)) {
				this.actionOptions["timeout"] = 0
			} else {
				this.actionOptions["timeout"] = v
			}
		},
		goGroupId: function (groupId) {
			let group = this.vFirewallPolicy.inbound.groups.$find(function (k, v) {
				return v.id == groupId
			})
			this.goGroup = group
			if (group == null) {
				// search outbound groups
				group = this.vFirewallPolicy.outbound.groups.$find(function (k, v) {
					return v.id == groupId
				})
				if (group == null) {
					this.goGroupName = ""
				} else {
					this.goGroup = group
					this.goGroupName = group.name
				}
			} else {
				this.goGroupName = group.name
			}
			this.goSetId = 0
			this.goSetName = ""
		},
		goSetId: function (setId) {
			if (this.goGroup == null) {
				return
			}
			let set = this.goGroup.sets.$find(function (k, v) {
				return v.id == setId
			})
			if (set == null) {
				this.goSetId = 0
				this.goSetName = ""
			} else {
				this.goSetName = set.name
			}
		},
		jsCookieLife: function (v) {
			v = parseInt(v)
			if (isNaN(v)) {
				this.actionOptions["life"] = 0
			} else {
				this.actionOptions["life"] = v
			}
		},
		jsCookieMaxFails: function (v) {
			v = parseInt(v)
			if (isNaN(v)) {
				this.actionOptions["maxFails"] = 0
			} else {
				this.actionOptions["maxFails"] = v
			}
		},
		jsCookieFailBlockTimeout: function (v) {
			v = parseInt(v)
			if (isNaN(v)) {
				this.actionOptions["failBlockTimeout"] = 0
			} else {
				this.actionOptions["failBlockTimeout"] = v
			}
		},
	},
	methods: {
		add: function () {
			this.action = null
			this.actionCode = "page"
			this.isAdding = true
			this.actionOptions = {}

			// 动作参数
			this.allowScope = "global"

			this.blockTimeout = ""
			this.blockTimeoutMax = ""
			this.blockScope = "global"

			this.captchaLife = ""
			this.captchaMaxFails = ""
			this.captchaFailBlockTimeout = ""

			this.jsCookieLife = ""
			this.jsCookieMaxFails = ""
			this.jsCookieFailBlockTimeout = ""

			this.get302Life = ""

			this.post307Life = ""

			this.recordIPLevel = "critical"
			this.recordIPType = "black"
			this.recordIPTimeout = ""
			this.recordIPListId = 0
			this.recordIPListName = ""

			this.tagTags = []

			this.pageUseDefault = true
			this.pageStatus = 403
			this.pageBody = this.defaultPageBody

			this.redirectStatus = 307
			this.redirectURL = ""

			this.goGroupName = ""
			this.goGroupId = 0
			this.goGroup = null

			this.goSetId = 0
			this.goSetName = ""

			let that = this
			this.action = this.vActions.$find(function (k, v) {
				return v.code == that.actionCode
			})

			// 滚到界面底部
			this.scroll()
		},
		remove: function (index) {
			this.isAdding = false
			this.editingIndex = -1
			this.configs.$remove(index)
		},
		update: function (index, config) {
			if (this.isAdding && this.editingIndex == index) {
				this.cancel()
				return
			}

			this.add()

			this.isAdding = true
			this.editingIndex = index

			this.actionCode = config.code
			this.action = this.actions.$find(function (k, v) {
				return v.code == config.code
			})

			switch (config.code) {
				case "block":
					this.blockTimeout = ""
					this.blockTimeoutMax = ""
					if (config.options.timeout != null || config.options.timeout > 0) {
						this.blockTimeout = config.options.timeout.toString()
					}
					if (config.options.timeoutMax != null || config.options.timeoutMax > 0) {
						this.blockTimeoutMax = config.options.timeoutMax.toString()
					}
					if (config.options.scope != null && config.options.scope.length > 0) {
						this.blockScope = config.options.scope
					} else {
						this.blockScope = "global" // 兼容先前版本遗留的默认值
					}
					break
				case "allow":
					if (config.options != null && config.options.scope != null && config.options.scope.length > 0) {
						this.allowScope = config.options.scope
					} else {
						this.allowScope = "global"
					}
					break
				case "log":
					break
				case "captcha":
					this.captchaLife = ""
					if (config.options.life != null || config.options.life > 0) {
						this.captchaLife = config.options.life.toString()
					}
					this.captchaMaxFails = ""
					if (config.options.maxFails != null || config.options.maxFails > 0) {
						this.captchaMaxFails = config.options.maxFails.toString()
					}
					this.captchaFailBlockTimeout = ""
					if (config.options.failBlockTimeout != null || config.options.failBlockTimeout > 0) {
						this.captchaFailBlockTimeout = config.options.failBlockTimeout.toString()
					}
					break
				case "js_cookie":
					this.jsCookieLife = ""
					if (config.options.life != null || config.options.life > 0) {
						this.jsCookieLife = config.options.life.toString()
					}
					this.jsCookieMaxFails = ""
					if (config.options.maxFails != null || config.options.maxFails > 0) {
						this.jsCookieMaxFails = config.options.maxFails.toString()
					}
					this.jsCookieFailBlockTimeout = ""
					if (config.options.failBlockTimeout != null || config.options.failBlockTimeout > 0) {
						this.jsCookieFailBlockTimeout = config.options.failBlockTimeout.toString()
					}
					break
				case "notify":
					break
				case "get_302":
					this.get302Life = ""
					if (config.options.life != null || config.options.life > 0) {
						this.get302Life = config.options.life.toString()
					}
					break
				case "post_307":
					this.post307Life = ""
					if (config.options.life != null || config.options.life > 0) {
						this.post307Life = config.options.life.toString()
					}
					break;
				case "record_ip":
					if (config.options != null) {
						this.recordIPLevel = config.options.level
						this.recordIPType = config.options.type
						if (config.options.timeout > 0) {
							this.recordIPTimeout = config.options.timeout.toString()
						}
						let that = this

						// VUE需要在函数执行完之后才会调用watch函数，这样会导致设置的值被覆盖，所以这里使用setTimeout
						setTimeout(function () {
							that.recordIPListId = config.options.ipListId
							that.recordIPListName = config.options.ipListName
						})
					}
					break
				case "tag":
					this.tagTags = []
					if (config.options.tags != null) {
						this.tagTags = config.options.tags
					}
					break
				case "page":
					this.pageUseDefault = true
					this.pageStatus = 403
					this.pageBody = this.defaultPageBody
					if (typeof config.options.useDefault === "boolean") {
						this.pageUseDefault = config.options.useDefault
					} else {
						this.pageUseDefault = false
					}
					if (config.options.status != null) {
						this.pageStatus = config.options.status
					}
					if (config.options.body != null) {
						this.pageBody = config.options.body
					}
					break
				case "redirect":
					this.redirectStatus = 307
					this.redirectURL = ""
					if (config.options.status != null) {
						this.redirectStatus = config.options.status
					}
					if (config.options.url != null) {
						this.redirectURL = config.options.url
					}
					break
				case "go_group":
					if (config.options != null) {
						this.goGroupName = config.options.groupName
						this.goGroupId = config.options.groupId
						this.goGroup = this.vFirewallPolicy.inbound.groups.$find(function (k, v) {
							return v.id == config.options.groupId
						})
					}
					break
				case "go_set":
					if (config.options != null) {
						this.goGroupName = config.options.groupName
						this.goGroupId = config.options.groupId
						this.goGroup = this.vFirewallPolicy.inbound.groups.$find(function (k, v) {
							return v.id == config.options.groupId
						})

						// VUE需要在函数执行完之后才会调用watch函数，这样会导致设置的值被覆盖，所以这里使用setTimeout
						let that = this
						setTimeout(function () {
							that.goSetId = config.options.setId
							if (that.goGroup != null) {
								let set = that.goGroup.sets.$find(function (k, v) {
									return v.id == config.options.setId
								})
								if (set != null) {
									that.goSetName = set.name
								}
							}
						})
					}
					break
			}

			// 滚到界面底部
			this.scroll()
		},
		cancel: function () {
			this.isAdding = false
			this.editingIndex = -1
		},
		confirm: function () {
			if (this.action == null) {
				return
			}

			if (this.actionOptions == null) {
				this.actionOptions = {}
			}

			// record_ip
			if (this.actionCode == "record_ip") {
				let timeout = parseInt(this.recordIPTimeout)
				if (isNaN(timeout)) {
					timeout = 0
				}
				if (this.recordIPListId < 0) { // can be 0
					return
				}
				this.actionOptions = {
					type: this.recordIPType,
					level: this.recordIPLevel,
					timeout: timeout,
					ipListId: this.recordIPListId,
					ipListName: this.recordIPListName
				}
			} else if (this.actionCode == "tag") { // tag
				if (this.tagTags == null || this.tagTags.length == 0) {
					return
				}
				this.actionOptions = {
					tags: this.tagTags
				}
			} else if (this.actionCode == "page") {
				let pageStatus = this.pageStatus.toString()
				if (!pageStatus.match(/^\d{3}$/)) {
					pageStatus = 403
				} else {
					pageStatus = parseInt(pageStatus)
				}

				this.actionOptions = {
					useDefault: this.pageUseDefault,
					status: pageStatus,
					body: this.pageBody
				}
			} else if (this.actionCode == "redirect") {
				let redirectStatus = this.redirectStatus.toString()
				if (!redirectStatus.match(/^\d{3}$/)) {
					redirectStatus = 307
				} else {
					redirectStatus = parseInt(redirectStatus)
				}

				if (this.redirectURL.length == 0) {
					teaweb.warn("请输入跳转到URL")
					return
				}

				this.actionOptions = {
					status: redirectStatus,
					url: this.redirectURL
				}
			} else if (this.actionCode == "go_group") { // go_group
				let groupId = this.goGroupId
				if (typeof (groupId) == "string") {
					groupId = parseInt(groupId)
					if (isNaN(groupId)) {
						groupId = 0
					}
				}
				if (groupId <= 0) {
					return
				}
				this.actionOptions = {
					groupId: groupId.toString(),
					groupName: this.goGroupName
				}
			} else if (this.actionCode == "go_set") { // go_set
				let groupId = this.goGroupId
				if (typeof (groupId) == "string") {
					groupId = parseInt(groupId)
					if (isNaN(groupId)) {
						groupId = 0
					}
				}

				let setId = this.goSetId
				if (typeof (setId) == "string") {
					setId = parseInt(setId)
					if (isNaN(setId)) {
						setId = 0
					}
				}
				if (setId <= 0) {
					return
				}
				this.actionOptions = {
					groupId: groupId.toString(),
					groupName: this.goGroupName,
					setId: setId.toString(),
					setName: this.goSetName
				}
			}

			let options = {}
			for (let k in this.actionOptions) {
				if (this.actionOptions.hasOwnProperty(k)) {
					options[k] = this.actionOptions[k]
				}
			}
			if (this.editingIndex > -1) {
				this.configs[this.editingIndex] = {
					id: this.configs[this.editingIndex].id,
					code: this.actionCode,
					name: this.action.name,
					options: options
				}
			} else {
				this.configs.push({
					id: (this.id++),
					code: this.actionCode,
					name: this.action.name,
					options: options
				})
			}

			this.cancel()
		},
		removeRecordIPList: function () {
			this.recordIPListId = 0
		},
		selectRecordIPList: function () {
			let that = this
			teaweb.popup("/servers/iplists/selectPopup?type=" + this.recordIPType, {
				width: "50em",
				height: "30em",
				callback: function (resp) {
					that.recordIPListId = resp.data.list.id
					that.recordIPListName = resp.data.list.name
				}
			})
		},
		changeTags: function (tags) {
			this.tagTags = tags
		},
		loadJS: function (callback) {
			if (typeof Sortable != "undefined") {
				callback()
				return
			}

			// 引入js
			let jsFile = document.createElement("script")
			jsFile.setAttribute("src", "/js/sortable.min.js")
			jsFile.addEventListener("load", function () {
				callback()
			})
			document.head.appendChild(jsFile)
		},
		scroll: function () {
			setTimeout(function () {
				let mainDiv = document.getElementsByClassName("main")
				if (mainDiv.length > 0) {
					mainDiv[0].scrollTo(0, 1000)
				}
			}, 10)
		}
	},
	template: `<div>
	<input type="hidden" name="actionsJSON" :value="JSON.stringify(configs)"/>
	<div v-show="configs.length > 0" style="margin-bottom: 0.5em" id="actions-box"> 
		<div v-for="(config, index) in configs" :data-index="index" :key="config.id" class="ui label small basic" :class="{blue: index == editingIndex}" style="margin-bottom: 0.4em">
			{{config.name}} <span class="small">({{config.code.toUpperCase()}})</span> 
			
			<!-- allow -->
			<span class="small" v-if="config.code == 'allow' && config.options != null && config.options.scope != null && config.options.scope.length > 0">
				<span v-if="config.options.scope == 'group'">[分组]</span>
				<span v-if="config.options.scope == 'server'">[网站]</span>
				<span v-if="config.options.scope == 'global'">[网站和策略]</span>
			</span>
			
			<!-- block -->
			<span v-if="config.code == 'block' && config.options.timeout > 0">：封禁时长{{config.options.timeout}}<span v-if="config.options.timeoutMax > config.options.timeout">-{{config.options.timeoutMax}}</span>秒</span>
			
			<!-- captcha -->
			<span v-if="config.code == 'captcha' && config.options.life > 0">：有效期{{config.options.life}}秒
				<span v-if="config.options.maxFails > 0"> / 最多失败{{config.options.maxFails}}次</span>
			</span>
			
			<!-- js cookie -->
			<span v-if="config.code == 'js_cookie' && config.options.life > 0">：有效期{{config.options.life}}秒
				<span v-if="config.options.maxFails > 0"> / 最多失败{{config.options.maxFails}}次</span>
			</span>
			
			<!-- get 302 -->
			<span v-if="config.code == 'get_302' && config.options.life > 0">：有效期{{config.options.life}}秒</span>
			
			<!-- post 307 -->
			<span v-if="config.code == 'post_307' && config.options.life > 0">：有效期{{config.options.life}}秒</span>
			
			<!-- record_ip -->
			<span v-if="config.code == 'record_ip'">：<span v-if="config.code == 'record_ip'">：<span :class="{red: config.options.ipListIsDeleted}">{{config.options.ipListName}}</span></span>{{config.options.ipListName}}</span></span>
			
			<!-- tag -->
			<span v-if="config.code == 'tag'">：{{config.options.tags.join(", ")}}</span>
			
			<!-- page -->
			<span v-if="config.code == 'page'">：[{{config.options.status}}]<span v-if="config.options.useDefault">&nbsp; [默认页面]</span></span>
			
			<!-- redirect -->
			<span v-if="config.code == 'redirect'">：{{config.options.url}}</span>
			
			<!-- go_group -->
			<span v-if="config.code == 'go_group'">：{{config.options.groupName}}</span>
			
			<!-- go_set -->
			<span v-if="config.code == 'go_set'">：{{config.options.groupName}} / {{config.options.setName}}</span>
			
			<!-- 范围 -->
			<span v-if="config.code != 'allow' && config.options.scope != null && config.options.scope.length > 0" class="small grey">
				&nbsp; 
				<span v-if="config.options.scope == 'global'">[所有网站]</span>
				<span v-if="config.options.scope == 'service'">[当前网站]</span>
			</span>
			
			<!-- 操作按钮 -->
			 &nbsp; <a href="" title="修改" @click.prevent="update(index, config)"><i class="icon pencil small"></i></a> &nbsp; <a href="" title="删除" @click.prevent="remove(index)"><i class="icon remove small"></i></a> &nbsp; <a href="" title="拖动改变顺序"><i class="icon bars handle"></i></a>
		</div>
		<div class="ui divider"></div>
	</div>
	<div style="margin-bottom: 0.5em" v-if="isAdding">
		<table class="ui table" :class="{blue: editingIndex > -1}">
			<tr>
				<td class="title">动作类型 *</td>
				<td>
					<select class="ui dropdown auto-width" v-model="actionCode">
						<option v-for="action in actions" :value="action.code">{{action.name}} ({{action.code.toUpperCase()}})</option>
					</select>
					<p class="comment" v-if="action != null && action.description.length > 0">{{action.description}}</p>
				</td>
			</tr>
			
			<!-- allow -->
			<tr v-if="actionCode == 'allow'">
				<td>有效范围</td>
				<td>
					<select class="ui dropdown auto-width" v-model="allowScope">
						<option value="group">分组</option>
						<option value="server">网站</option>
						<option value="global">网站和策略</option>
					</select>
					<p class="comment" v-if="allowScope == 'group'">跳过当前分组其他规则集，继续执行其他分组的规则集。</p>
					<p class="comment" v-if="allowScope == 'server'">跳过当前网站所有的规则集。</p>
					<p class="comment" v-if="allowScope =='global'">跳过当前网站和网站对应WAF策略所有的规则集。</p>
				</td>
			</tr>
			
			<!-- block -->
			<tr v-if="actionCode == 'block'">
				<td>封禁范围</td>
				<td>
					<select class="ui dropdown auto-width" v-model="blockScope">
						<option value="service">当前网站</option>
						<option value="global">所有网站</option>
					</select>
					<p class="comment" v-if="blockScope == 'service'">只封禁用户对当前网站的访问，其他网站不受影响。</p>
					<p class="comment" v-if="blockScope =='global'">封禁用户对所有网站的访问。</p>
				</td>
			</tr>
			<tr v-if="actionCode == 'block'">
				<td>封禁时长</td>
				<td>
					<div class="ui input right labeled">
						<input type="text" style="width: 5em" maxlength="9" v-model="blockTimeout" @keyup.enter="confirm()" @keypress.enter.prevent="1"/>
						<span class="ui label">秒</span>
					</div>
				</td>
			</tr>
			<tr v-if="actionCode == 'block'">
				<td>最大封禁时长</td>
				<td>
					<div class="ui input right labeled">
						<input type="text" style="width: 5em" maxlength="9" v-model="blockTimeoutMax" @keyup.enter="confirm()" @keypress.enter.prevent="1"/>
						<span class="ui label">秒</span>
					</div>
					<p class="comment">选填项。如果同时填写了封禁时长和最大封禁时长，则会在两者之间随机选择一个数字作为最终的封禁时长。</p>
				</td>
			</tr>
			
			<!-- captcha -->
			<tr v-if="actionCode == 'captcha'">
				<td>有效时间</td>
				<td>
					<div class="ui input right labeled">
						<input type="text" style="width: 5em" maxlength="9" v-model="captchaLife" @keyup.enter="confirm()" @keypress.enter.prevent="1"/>
						<span class="ui label">秒</span>
					</div>
					<p class="comment">验证通过后在这个时间内不再验证；如果为空或者为0表示默认。</p>
				</td>
			</tr>
			<tr v-if="actionCode == 'captcha'">
				<td>最多失败次数</td>
				<td>
					<div class="ui input right labeled">
						<input type="text" style="width: 5em" maxlength="9" v-model="captchaMaxFails" @keyup.enter="confirm()" @keypress.enter.prevent="1"/>
						<span class="ui label">次</span>
					</div>
					<p class="comment"><span v-if="captchaMaxFails > 0 && captchaMaxFails < 5" class="red">建议填入一个不小于5的数字，以减少误判几率。</span>允许用户失败尝试的最多次数，超过这个次数将被自动加入黑名单；如果为空或者为0表示默认。</p>
				</td>
			</tr>
			<tr v-if="actionCode == 'captcha'">
				<td>失败拦截时间</td>
				<td>
					<div class="ui input right labeled">
						<input type="text" style="width: 5em" maxlength="9" v-model="captchaFailBlockTimeout" @keyup.enter="confirm()" @keypress.enter.prevent="1"/>
						<span class="ui label">秒</span>
					</div>
					<p class="comment">在达到最多失败次数（大于0）时，自动拦截的时间；如果为空或者为0表示默认。</p>
				</td>
			</tr>
			
			<!-- js cookie -->
			<tr v-if="actionCode == 'js_cookie'">
				<td>有效时间</td>
				<td>
					<div class="ui input right labeled">
						<input type="text" style="width: 5em" maxlength="9" v-model="jsCookieLife" @keyup.enter="confirm()" @keypress.enter.prevent="1"/>
						<span class="ui label">秒</span>
					</div>
					<p class="comment">验证通过后在这个时间内不再验证；如果为空或者为0表示默认。</p>
				</td>
			</tr>
			<tr v-if="actionCode == 'js_cookie'">
				<td>最多失败次数</td>
				<td>
					<div class="ui input right labeled">
						<input type="text" style="width: 5em" maxlength="9" v-model="jsCookieMaxFails" @keyup.enter="confirm()" @keypress.enter.prevent="1"/>
						<span class="ui label">次</span>
					</div>
					<p class="comment">允许用户失败尝试的最多次数，超过这个次数将被自动加入黑名单；如果为空或者为0表示默认。</p>
				</td>
			</tr>
			<tr v-if="actionCode == 'js_cookie'">
				<td>失败拦截时间</td>
				<td>
					<div class="ui input right labeled">
						<input type="text" style="width: 5em" maxlength="9" v-model="jsCookieFailBlockTimeout" @keyup.enter="confirm()" @keypress.enter.prevent="1"/>
						<span class="ui label">秒</span>
					</div>
					<p class="comment">在达到最多失败次数（大于0）时，自动拦截的时间；如果为空或者为0表示默认。</p>
				</td>
			</tr>
			
			<!-- get_302 -->
			<tr v-if="actionCode == 'get_302'">
				<td>有效时间</td>
				<td>
					<div class="ui input right labeled">
						<input type="text" style="width: 5em" maxlength="9" v-model="get302Life" @keyup.enter="confirm()" @keypress.enter.prevent="1"/>
						<span class="ui label">秒</span>
					</div>
					<p class="comment">验证通过后在这个时间内不再验证。</p>
				</td>
			</tr>
			
			<!-- post_307 -->
			<tr v-if="actionCode == 'post_307'">
				<td>有效时间</td>
				<td>
					<div class="ui input right labeled">
						<input type="text" style="width: 5em" maxlength="9" v-model="post307Life" @keyup.enter="confirm()" @keypress.enter.prevent="1"/>
						<span class="ui label">秒</span>
					</div>
					<p class="comment">验证通过后在这个时间内不再验证。</p>
				</td>
			</tr>
			
			<!-- record_ip -->
			<tr v-if="actionCode == 'record_ip'">
				<td>IP名单类型 *</td>
				<td>
					<select class="ui dropdown auto-width" v-model="recordIPType">
					<option value="black">黑名单</option>
					<option value="white">白名单</option>
					</select>
				</td>
			</tr>
			<tr v-if="actionCode == 'record_ip'">
				<td>选择IP名单</td>
				<td>
					<div v-if="recordIPListId > 0" class="ui label basic small">{{recordIPListName}} <a href="" @click.prevent="removeRecordIPList"><i class="icon remove small"></i></a></div>
					<button type="button" class="ui button tiny" @click.prevent="selectRecordIPList">+</button>
					<p class="comment">如不选择，则自动添加到当前策略的IP名单中。</p>
				</td>
			</tr>
			<tr v-if="actionCode == 'record_ip'">
				<td>级别</td>
				<td>
					<select class="ui dropdown auto-width" v-model="recordIPLevel">
						<option v-for="level in ipListLevels" :value="level.code">{{level.name}}</option>
					</select>
				</td>
			</tr>
			<tr v-if="actionCode == 'record_ip'">
				<td>超时时间</td>
				<td>
					<div class="ui input right labeled">
						<input type="text" style="width: 6em" maxlength="9" v-model="recordIPTimeout" @keyup.enter="confirm()" @keypress.enter.prevent="1"/>
						<span class="ui label">秒</span>
					</div>
					<p class="comment">0表示不超时。</p>
				</td>
			</tr>
			
			<!-- tag -->
			<tr v-if="actionCode == 'tag'">
				<td>标签 *</td>
				<td>
					<values-box @change="changeTags" :values="tagTags"></values-box>
				</td>
			</tr>
			
			<!-- page -->
			<tr v-if="actionCode == 'page'">
				<td>使用默认提示</td>
				<td>
					<checkbox v-model="pageUseDefault"></checkbox>
				</td>
			</tr>
			<tr v-if="actionCode == 'page' && !pageUseDefault">
				<td>状态码 *</td>
				<td><input type="text" style="width: 4em" maxlength="3" v-model="pageStatus"/></td>
			</tr>
			<tr v-if="actionCode == 'page' && !pageUseDefault">
				<td>网页内容</td>
				<td>
					<textarea v-model="pageBody"></textarea>
				</td>
			</tr>
			
			<!-- redirect -->
			<tr v-if="actionCode == 'redirect'">
				<td>状态码 *</td>
				<td>
					<select class="ui dropdown auto-width" v-model="redirectStatus">
						<option v-for="status in statusOptions" :value="status.code">{{status.code}} {{status.text}}</option>
					</select>
				</td>
			</tr>
			<tr v-if="actionCode == 'redirect'">
				<td>跳转到URL</td>
				<td>
					<input type="text" v-model="redirectURL"/>
				</td>
			</tr>
			
			<!-- 规则分组 -->
			<tr v-if="actionCode == 'go_group'">
				<td>下一个分组 *</td>
				<td>
					<select class="ui dropdown auto-width" v-model="goGroupId">
						<option value="0">[选择分组]</option>
						<option v-if="vFirewallPolicy.inbound != null && vFirewallPolicy.inbound.groups != null" v-for="group in vFirewallPolicy.inbound.groups" :value="group.id">入站：{{group.name}}</option>
						<option v-if="vGroupType == 'outbound' && vFirewallPolicy.outbound != null && vFirewallPolicy.outbound.groups != null" v-for="group in vFirewallPolicy.outbound.groups" :value="group.id">出站：{{group.name}}</option>
					</select>
				</td>
			</tr>
			
			<!-- 规则集 -->
			<tr v-if="actionCode == 'go_set'">
				<td>下一个分组 *</td>
				<td>
					<select class="ui dropdown auto-width" v-model="goGroupId">
						<option value="0">[选择分组]</option>
						<option v-if="vFirewallPolicy.inbound != null && vFirewallPolicy.inbound.groups != null" v-for="group in vFirewallPolicy.inbound.groups" :value="group.id">入站：{{group.name}}</option>
						<option v-if="vGroupType == 'outbound' && vFirewallPolicy.outbound != null && vFirewallPolicy.outbound.groups != null" v-for="group in vFirewallPolicy.outbound.groups" :value="group.id">出站：{{group.name}}</option>
					</select>
				</td>
			</tr>
			<tr v-if="actionCode == 'go_set' && goGroup != null">
				<td>下一个规则集 *</td>
				<td>
					<select class="ui dropdown auto-width" v-model="goSetId">
						<option value="0">[选择规则集]</option>
						<option v-for="set in goGroup.sets" :value="set.id">{{set.name}}</option>
					</select>
				</td>
			</tr>
		</table>
		<button class="ui button tiny" type="button" @click.prevent="confirm">确定</button> &nbsp;
		<a href="" @click.prevent="cancel" title="取消"><i class="icon remove small"></i></a>
	</div>
	<div v-if="!isAdding">
		<button class="ui button tiny" type="button" @click.prevent="add">+</button>
	</div>
	<p class="comment">系统总是会先执行记录日志、标签等不会修改请求的动作，再执行阻止、验证码等可能改变请求的动作。</p>
</div>`
})

Vue.component("http-cache-stale-config", {
	props: ["v-cache-stale-config"],
	data: function () {
		let config = this.vCacheStaleConfig
		if (config == null) {
			config = {
				isPrior: false,
				isOn: false,
				status: [],
				supportStaleIfErrorHeader: true,
				life: {
					count: 1,
					unit: "day"
				}
			}
		}
		return {
			config: config
		}
	},
	watch: {
		config: {
			deep: true,
			handler: function () {
				this.$emit("change", this.config)
			}
		}
	},
	methods: {},
	template: `<table class="ui table definition selectable">
	<tbody>
		<tr>
			<td class="title">启用过时缓存</td>
			<td>
				<checkbox v-model="config.isOn"></checkbox>
				<p class="comment">选中后，在更新缓存失败后会尝试读取过时的缓存。</p>
			</td>
		</tr>
		<tr v-show="config.isOn">
			<td>有效期</td>
			<td>
				<time-duration-box :v-value="config.life"></time-duration-box>
				<p class="comment">缓存在过期之后，仍然保留的时间。</p>
			</td>
		</tr>
		<tr v-show="config.isOn">
			<td>状态码</td>
			<td><http-status-box :v-status-list="config.status"></http-status-box>
				<p class="comment">在这些状态码出现时使用过时缓存，默认支持<code-label>50x</code-label>状态码。</p>
			</td>
		</tr>
		<tr v-show="config.isOn">
			<td>支持stale-if-error</td>
			<td>
				<checkbox v-model="config.supportStaleIfErrorHeader"></checkbox>
				<p class="comment">选中后，支持在Cache-Control中通过<code-label>stale-if-error</code-label>指定过时缓存有效期。</p>
			</td>
		</tr>
	</tbody>
</table>`
})

// 请求方法列表
Vue.component("http-methods-box", {
	props: ["v-methods"],
	data: function () {
		let methods = this.vMethods
		if (methods == null) {
			methods = []
		}
		return {
			methods: methods,
			isAdding: false,
			addingMethod: ""
		}
	},
	methods: {
		add: function () {
			this.isAdding = true
			let that = this
			setTimeout(function () {
				that.$refs.addingMethod.focus()
			}, 100)
		},
		confirm: function () {
			let that = this

			// 删除其中的空格
			this.addingMethod = this.addingMethod.replace(/\s/g, "").toUpperCase()

			if (this.addingMethod.length == 0) {
				teaweb.warn("请输入要添加的请求方法", function () {
					that.$refs.addingMethod.focus()
				})
				return
			}

			// 是否已经存在
			if (this.methods.$contains(this.addingMethod)) {
				teaweb.warn("此请求方法已经存在，无需重复添加", function () {
					that.$refs.addingMethod.focus()
				})
				return
			}

			this.methods.push(this.addingMethod)
			this.cancel()
		},
		remove: function (index) {
			this.methods.$remove(index)
		},
		cancel: function () {
			this.isAdding = false
			this.addingMethod = ""
		}
	},
	template: `<div>
	<input type="hidden" name="methodsJSON" :value="JSON.stringify(methods)"/>
	<div v-if="methods.length > 0">
		<span class="ui label small basic" v-for="(method, index) in methods">
			{{method}}
			&nbsp; <a href="" title="删除" @click.prevent="remove(index)"><i class="icon remove small"></i></a>
		</span>
		<div class="ui divider"></div>
	</div>
	<div v-if="isAdding">
		<div class="ui fields">
			<div class="ui field">
				<input type="text" v-model="addingMethod" @keyup.enter="confirm()" @keypress.enter.prevent="1" ref="addingMethod" placeholder="如GET" size="10"/>
			</div>
			<div class="ui field">
				<button class="ui button tiny" type="button" @click.prevent="confirm">确定</button>
				&nbsp; <a href="" title="取消" @click.prevent="cancel"><i class="icon remove small"></i></a>
			</div>
		</div>
		<p class="comment">格式为大写，比如<code-label>GET</code-label>、<code-label>POST</code-label>等。</p>
		<div class="ui divider"></div>
	</div>
	<div style="margin-top: 0.5em" v-if="!isAdding">
		<button class="ui button tiny" type="button" @click.prevent="add">+</button>
	</div>
</div>`
})

Vue.component("http-header-replace-values", {
	props: ["v-replace-values"],
	data: function () {
		let values = this.vReplaceValues
		if (values == null) {
			values = []
		}
		return {
			values: values,
			isAdding: false,
			addingValue: {"pattern": "", "replacement": "", "isCaseInsensitive": false, "isRegexp": false}
		}
	},
	methods: {
		add: function () {
			this.isAdding = true
			let that = this
			setTimeout(function () {
				that.$refs.pattern.focus()
			})
		},
		remove: function (index) {
			this.values.$remove(index)
		},
		confirm: function () {
			let that = this
			if (this.addingValue.pattern.length == 0) {
				teaweb.warn("替换前内容不能为空", function () {
					that.$refs.pattern.focus()
				})
				return
			}

			this.values.push(this.addingValue)
			this.cancel()
		},
		cancel: function () {
			this.isAdding = false
			this.addingValue = {"pattern": "", "replacement": "", "isCaseInsensitive": false, "isRegexp": false}
		}
	},
	template: `<div>
	<input type="hidden" name="replaceValuesJSON" :value="JSON.stringify(values)"/>
	<div>
		<div v-for="(value, index) in values" class="ui label small" style="margin-bottom: 0.5em">
			<var>{{value.pattern}}</var><sup v-if="value.isCaseInsensitive" title="不区分大小写"><i class="icon info tiny"></i></sup> =&gt; <var v-if="value.replacement.length > 0">{{value.replacement}}</var><var v-else><span class="small grey">[空]</span></var>
			<a href="" @click.prevent="remove(index)" title="删除"><i class="icon remove small"></i></a>
		</div>
	</div>
	<div v-if="isAdding">
		<table class="ui table">
			<tr>
				<td class="title">替换前内容 *</td>
				<td><input type="text" v-model="addingValue.pattern" placeholder="替换前内容" ref="pattern" @keyup.enter="confirm()" @keypress.enter.prevent="1"/></td>
			</tr>	
			<tr>
				<td>替换后内容</td>
				<td><input type="text" v-model="addingValue.replacement" placeholder="替换后内容" @keyup.enter="confirm()" @keypress.enter.prevent="1"/></td>
			</tr>
			<tr>
				<td>是否忽略大小写</td>
				<td>
					<checkbox v-model="addingValue.isCaseInsensitive"></checkbox>
				</td>
			</tr>
		</table>

		<div>
			<button type="button" class="ui button tiny" @click.prevent="confirm">确定</button> &nbsp;
			<a href="" title="取消" @click.prevent="cancel"><i class="icon remove small"></i></a>
		</div>
	</div>
	<div v-if="!isAdding">
		<button type="button" class="ui button tiny" @click.prevent="add">+</button>
	</div>
</div>`
})

Vue.component("script-group-config-box", {
	props: ["v-group", "v-auditing-status", "v-is-location"],
	data: function () {
		let group = this.vGroup
		if (group == null) {
			group = {
				isPrior: false,
				isOn: true,
				scripts: []
			}
		}
		if (group.scripts == null) {
			group.scripts = []
		}

		let script = null
		if (group.scripts.length > 0) {
			script = group.scripts[group.scripts.length - 1]
		}

		return {
			group: group,
			script: script
		}
	},
	methods: {
		changeScript: function (script) {
			this.group.scripts = [script] // 目前只支持单个脚本
			this.change()
		},
		change: function () {
			this.$emit("change", this.group)
		}
	},
	template: `<div>
		<table class="ui table definition selectable">
			<prior-checkbox :v-config="group" v-if="vIsLocation"></prior-checkbox>
		</table>
		<div :style="{opacity: (!vIsLocation || group.isPrior) ? 1 : 0.5}">
			<script-config-box :v-script-config="script" :v-auditing-status="vAuditingStatus" comment="在接收到客户端请求之后立即调用。预置req、resp变量。" @change="changeScript" :v-is-location="vIsLocation"></script-config-box>
		</div>
</div>`
})

Vue.component("http-request-conds-box", {
	props: ["v-conds"],
	data: function () {
		let conds = this.vConds
		if (conds == null) {
			conds = {
				isOn: true,
				connector: "or",
				groups: []
			}
		}
		if (conds.groups == null) {
			conds.groups = []
		}
		return {
			conds: conds,
			components: window.REQUEST_COND_COMPONENTS
		}
	},
	methods: {
		change: function () {
			this.$emit("change", this.conds)
		},
		addGroup: function () {
			window.UPDATING_COND_GROUP = null

			let that = this
			teaweb.popup("/servers/server/settings/conds/addGroupPopup", {
				height: "30em",
				callback: function (resp) {
					that.conds.groups.push(resp.data.group)
					that.change()
				}
			})
		},
		updateGroup: function (groupIndex, group) {
			window.UPDATING_COND_GROUP = group
			let that = this
			teaweb.popup("/servers/server/settings/conds/addGroupPopup", {
				height: "30em",
				callback: function (resp) {
					Vue.set(that.conds.groups, groupIndex, resp.data.group)
					that.change()
				}
			})
		},
		removeGroup: function (groupIndex) {
			let that = this
			teaweb.confirm("确定要删除这一组条件吗？", function () {
				that.conds.groups.$remove(groupIndex)
				that.change()
			})
		},
		typeName: function (cond) {
			let c = this.components.$find(function (k, v) {
				return v.type == cond.type
			})
			if (c != null) {
				return c.name;
			}
			return cond.param + " " + cond.operator
		}
	},
	template: `<div>
		<input type="hidden" name="condsJSON" :value="JSON.stringify(conds)"/>
		<div v-if="conds.groups.length > 0">
			<table class="ui table">
				<tr v-for="(group, groupIndex) in conds.groups">
					<td class="title" :class="{'color-border':conds.connector == 'and'}" :style="{'border-bottom':(groupIndex < conds.groups.length-1) ? '1px solid rgba(34,36,38,.15)':''}">分组{{groupIndex+1}}</td>
					<td style="background: white; word-break: break-all" :style="{'border-bottom':(groupIndex < conds.groups.length-1) ? '1px solid rgba(34,36,38,.15)':''}">
						<var v-for="(cond, index) in group.conds" style="font-style: normal;display: inline-block; margin-bottom:0.5em">
							<span class="ui label tiny">
								<var v-if="cond.type.length == 0 || cond.type == 'params'" style="font-style: normal">{{cond.param}} <var>{{cond.operator}}</var></var>
								<var v-if="cond.type.length > 0 && cond.type != 'params'" style="font-style: normal">{{typeName(cond)}}: </var>
								{{cond.value}}
								<sup v-if="cond.isCaseInsensitive" title="不区分大小写"><i class="icon info small"></i></sup>
							</span>
							
							<var v-if="index < group.conds.length - 1"> {{group.connector}} &nbsp;</var>
						</var>
					</td>
					<td style="width: 5em; background: white" :style="{'border-bottom':(groupIndex < conds.groups.length-1) ? '1px solid rgba(34,36,38,.15)':''}">
						<a href="" title="修改分组" @click.prevent="updateGroup(groupIndex, group)"><i class="icon pencil small"></i></a> <a href="" title="删除分组" @click.prevent="removeGroup(groupIndex)"><i class="icon remove"></i></a>
					</td>
				</tr>
			</table>
			<div class="ui divider"></div>
		</div>
		
		<!-- 分组之间关系 -->
		<table class="ui table" v-if="conds.groups.length > 1">
			<tr>
				<td class="title">分组之间关系</td>
				<td>
					<select class="ui dropdown auto-width" v-model="conds.connector">
						<option value="and">和</option>
						<option value="or">或</option>
					</select>
					<p class="comment">
						<span v-if="conds.connector == 'or'">只要满足其中一个条件分组即可。</span>
						<span v-if="conds.connector == 'and'">需要满足所有条件分组。</span>
					</p>	
				</td>
			</tr>
		</table>
		
		<div>
			<button class="ui button tiny basic" type="button" @click.prevent="addGroup()">+添加分组</button>
		</div>
	</div>	
</div>`
})

// 压缩配置
Vue.component("http-optimization-config-box", {
	props: ["v-optimization-config", "v-is-location", "v-is-group"],
	data: function () {
		let config = this.vOptimizationConfig

		return {
			config: config,
			htmlMoreOptions: false,
			javascriptMoreOptions: false,
			cssMoreOptions: false
		}
	},
	methods: {
		isOn: function () {
			return ((!this.vIsLocation && !this.vIsGroup) || this.config.isPrior) && this.config.isOn
		}
	},
	template: `<div>
	<input type="hidden" name="optimizationJSON" :value="JSON.stringify(config)"/>
	<table class="ui table definition selectable" v-if="vIsLocation || vIsGroup">
		<prior-checkbox :v-config="config"></prior-checkbox>
	</table>
	
	<div v-show="(!vIsLocation && !vIsGroup) || config.isPrior">
		<div class="margin"></div>
		<table class="ui table definition selectable">
			<tbody>
				<tr>
					<td class="title">HTML优化</td>
					<td>
						<div class="ui checkbox">
							<input type="checkbox" value="1" v-model="config.html.isOn"/>
							<label></label>
						</div>
						<p class="comment">可以自动优化HTML中包含的空白、注释、空标签等。只有文件可以缓存时才会被优化。</p>
					</td>
				</tr>
				<tr v-show="config.html.isOn">
					<td colspan="2"><more-options-indicator v-model="htmlMoreOptions"></more-options-indicator></td>
				</tr>
			</tbody>
			<tbody v-show="htmlMoreOptions">
				<tr>
					<td>HTML例外URL</td>
					<td>
						<url-patterns-box v-model="config.html.exceptURLPatterns"></url-patterns-box>
						<p class="comment">如果填写了例外URL，表示这些URL跳过不做处理。</p>
					</td>
				</tr>
				<tr>
					<td>HTML限制URL</td>
					<td>
						<url-patterns-box v-model="config.html.onlyURLPatterns"></url-patterns-box>
						<p class="comment">如果填写了限制URL，表示只对这些URL进行优化处理；如果不填则表示支持所有的URL。</p>
					</td>
				</tr>	
			</tbody>
		</table>
		
		<table class="ui table definition selectable">
			<tbody>
				<tr>
					<td class="title">Javascript优化</td>
					<td>
						<div class="ui checkbox">
							<input type="checkbox" value="1" v-model="config.javascript.isOn"/>
							<label></label>
						</div>
						<p class="comment">可以自动缩短Javascript中变量、函数名称等。只有文件可以缓存时才会被优化。</p>
					</td>
				</tr>
				<tr v-show="config.javascript.isOn">
					<td colspan="2"><more-options-indicator v-model="javascriptMoreOptions"></more-options-indicator></td>
				</tr>
			</tbody>
			<tbody v-show="javascriptMoreOptions">
				<tr>
					<td>Javascript例外URL</td>
					<td>
						<url-patterns-box v-model="config.javascript.exceptURLPatterns"></url-patterns-box>
						<p class="comment">如果填写了例外URL，表示这些URL跳过不做处理。</p>
					</td>
				</tr>
				<tr>
					<td>Javascript限制URL</td>
					<td>
						<url-patterns-box v-model="config.javascript.onlyURLPatterns"></url-patterns-box>
						<p class="comment">如果填写了限制URL，表示只对这些URL进行优化处理；如果不填则表示支持所有的URL。</p>
					</td>
				</tr>	
			</tbody>
		</table>
		
		<table class="ui table definition selectable">
			<tbody>
				<tr>
					<td class="title">CSS优化</td>
					<td>
						<div class="ui checkbox">
							<input type="checkbox" value="1" v-model="config.css.isOn"/>
							<label></label>
						</div>
						<p class="comment">可以自动去除CSS中包含的空白。只有文件可以缓存时才会被优化。</p>
					</td>
				</tr>
				<tr v-show="config.css.isOn">
					<td colspan="2"><more-options-indicator v-model="cssMoreOptions"></more-options-indicator></td>
				</tr>
			</tbody>
			<tbody v-show="cssMoreOptions">
				<tr>
					<td>CSS例外URL</td>
					<td>
						<url-patterns-box v-model="config.css.exceptURLPatterns"></url-patterns-box>
						<p class="comment">如果填写了例外URL，表示这些URL跳过不做处理。</p>
					</td>
				</tr>
				<tr>
					<td>CSS限制URL</td>
					<td>
						<url-patterns-box v-model="config.css.onlyURLPatterns"></url-patterns-box>
						<p class="comment">如果填写了限制URL，表示只对这些URL进行优化处理；如果不填则表示支持所有的URL。</p>
					</td>
				</tr>	
			</tbody>
		</table>
	</div>
	
	<div class="margin"></div>
</div>`
})

Vue.component("server-traffic-limit-status-viewer", {
	props: ["value"],
	data: function () {
		let targetTypeName = "流量"
		if (this.value != null) {
			targetTypeName = this.targetTypeToName(this.value.targetType)
		}

		return {
			status: this.value,
			targetTypeName: targetTypeName
		}
	},
	methods: {
		targetTypeToName: function (targetType) {
			switch (targetType) {
				case "traffic":
					return "流量"
				case "request":
					return "请求数"
				case "websocketConnections":
					return "Websocket连接数"
			}
			return "流量"
		}
	},
	template: `<span v-if="status != null">
	<span v-if="status.dateType == 'day'" class="small red">已达到<span v-if="status.planId > 0">套餐</span>当日{{targetTypeName}}限制</span>
	<span v-if="status.dateType == 'month'" class="small red">已达到<span v-if="status.planId > 0">套餐</span>当月{{targetTypeName}}限制</span>
	<span v-if="status.dateType == 'total'" class="small red">已达到<span v-if="status.planId > 0">套餐</span>总体{{targetTypeName}}限制</span>
</span>`
})

Vue.component("http-remote-addr-config-box", {
	props: ["v-remote-addr-config", "v-is-location", "v-is-group"],
	data: function () {
		let config = this.vRemoteAddrConfig
		if (config == null) {
			config = {
				isPrior: false,
				isOn: false,
				value: "${rawRemoteAddr}",
				type: "default",

				requestHeaderName: ""
			}
		}

		// type
		if (config.type == null || config.type.length == 0) {
			config.type = "default"
			switch (config.value) {
				case "${rawRemoteAddr}":
					config.type = "default"
					break
				case "${remoteAddrValue}":
					config.type = "default"
					break
				case "${remoteAddr}":
					config.type = "proxy"
					break
				default:
					if (config.value != null && config.value.length > 0) {
						config.type = "variable"
					}
			}
		}

		// value
		if (config.value == null || config.value.length == 0) {
			config.value = "${rawRemoteAddr}"
		}

		return {
			config: config,
			options: [
				{
					name: "直接获取",
					description: "用户直接访问边缘节点，即 \"用户 --> 边缘节点\" 模式，这时候系统会试图从直接的连接中读取到客户端IP地址。",
					value: "${rawRemoteAddr}",
					type: "default"
				},
				{
					name: "从上级代理中获取",
					description: "用户和边缘节点之间有别的代理服务转发，即 \"用户 --> [第三方代理服务] --> 边缘节点\"，这时候只能从上级代理中获取传递的IP地址；上级代理传递的请求报头中必须包含 X-Forwarded-For 或 X-Real-IP 信息。",
					value: "${remoteAddr}",
					type: "proxy"
				},
				{
					name: "从请求报头中读取",
					description: "从自定义请求报头读取客户端IP。",
					value: "",
					type: "requestHeader"
				},
				{
					name: "[自定义变量]",
					description: "通过自定义变量来获取客户端真实的IP地址。",
					value: "",
					type: "variable"
				}
			]
		}
	},
	watch: {
		"config.requestHeaderName": function (value) {
			if (this.config.type == "requestHeader"){
				this.config.value = "${header." + value.trim() + "}"
			}
		}
	},
	methods: {
		isOn: function () {
			return ((!this.vIsLocation && !this.vIsGroup) || this.config.isPrior) && this.config.isOn
		},
		changeOptionType: function () {
			let that = this

			switch(this.config.type) {
				case "default":
					this.config.value = "${rawRemoteAddr}"
					break
				case "proxy":
					this.config.value = "${remoteAddr}"
					break
				case "requestHeader":
					this.config.value = ""
					if (this.requestHeaderName != null && this.requestHeaderName.length > 0) {
						this.config.value = "${header." + this.requestHeaderName + "}"
					}

					setTimeout(function () {
						that.$refs.requestHeaderInput.focus()
					})
					break
				case "variable":
					this.config.value = "${rawRemoteAddr}"

					setTimeout(function () {
						that.$refs.variableInput.focus()
					})

					break
			}
		}
	},
	template: `<div>
	<input type="hidden" name="remoteAddrJSON" :value="JSON.stringify(config)"/>
	<table class="ui table definition selectable">
		<prior-checkbox :v-config="config" v-if="vIsLocation || vIsGroup"></prior-checkbox>
		<tbody v-show="(!vIsLocation && !vIsGroup) || config.isPrior">
			<tr>
				<td class="title">启用访客IP设置</td>
				<td>
					<div class="ui checkbox">
						<input type="checkbox" value="1" v-model="config.isOn"/>
						<label></label>
					</div>
					<p class="comment">选中后，表示使用自定义的请求变量获取客户端IP。</p>
				</td>
			</tr>
		</tbody>
		<tbody v-show="isOn()">
			<tr>
				<td>获取IP方式 *</td>
				<td>
					<select class="ui dropdown auto-width" v-model="config.type" @change="changeOptionType">
						<option v-for="option in options" :value="option.type">{{option.name}}</option>
					</select>
					<p class="comment" v-for="option in options" v-if="option.type == config.type && option.description.length > 0">{{option.description}}</p>
				</td>
			</tr>
			
			<!-- read from request header -->
			<tr v-show="config.type == 'requestHeader'">
				<td>请求报头 *</td>
				<td>
					<input type="text" name="requestHeaderName" v-model="config.requestHeaderName" maxlength="100" ref="requestHeaderInput"/>
					<p class="comment">请输入包含有客户端IP的请求报头，需要注意大小写，常见的有<code-label>X-Forwarded-For</code-label>、<code-label>X-Real-IP</code-label>、<code-label>X-Client-IP</code-label>等。</p>
				</td>
			</tr>
			
			<!-- read from variable -->
			<tr v-show="config.type == 'variable'">
				<td>读取IP变量值 *</td>
				<td>
					<input type="text" name="value" v-model="config.value" maxlength="100" ref="variableInput"/>
					<p class="comment">通过此变量获取用户的IP地址。具体可用的请求变量列表可参考官方网站文档；比如通过报头传递IP的情形，可以使用<code-label>\${header.你的自定义报头}</code-label>（类似于<code-label>\${header.X-Forwarded-For}</code-label>，需要注意大小写规范）。</p>
				</td>
			</tr>
		</tbody>
	</table>
	<div class="margin"></div>		
</div>`
})

Vue.component("ssl-certs-view", {
	props: ["v-certs"],
	data: function () {
		let certs = this.vCerts
		if (certs == null) {
			certs = []
		}
		return {
			certs: certs
		}
	},
	methods: {
		// 格式化时间
		formatTime: function (timestamp) {
			return new Date(timestamp * 1000).format("Y-m-d")
		},

		// 查看详情
		viewCert: function (certId) {
			teaweb.popup("/servers/certs/certPopup?certId=" + certId, {
				height: "28em",
				width: "48em"
			})
		}
	},
	template: `<div>
	<div v-if="certs != null && certs.length > 0">
		<div class="ui label small" v-for="(cert, index) in certs">
			{{cert.name}} / {{cert.dnsNames}} / 有效至{{formatTime(cert.timeEndAt)}} &nbsp;<a href="" title="查看" @click.prevent="viewCert(cert.id)"><i class="icon expand blue"></i></a>
		</div>
	</div>
</div>`
})

// 基本认证用户配置
Vue.component("http-auth-basic-auth-user-box", {
	props: ["v-users"],
	data: function () {
		let users = this.vUsers
		if (users == null) {
			users = []
		}
		return {
			users: users,
			isAdding: false,
			updatingIndex: -1,

			username: "",
			password: ""
		}
	},
	methods: {
		add: function () {
			this.isAdding = true
			this.username = ""
			this.password = ""

			let that = this
			setTimeout(function () {
				that.$refs.username.focus()
			}, 100)
		},
		cancel: function () {
			this.isAdding = false
			this.updatingIndex = -1
		},
		confirm: function () {
			let that = this
			if (this.username.length == 0) {
				teaweb.warn("请输入用户名", function () {
					that.$refs.username.focus()
				})
				return
			}
			if (this.password.length == 0) {
				teaweb.warn("请输入密码", function () {
					that.$refs.password.focus()
				})
				return
			}
			if (this.updatingIndex < 0) {
				this.users.push({
					username: this.username,
					password: this.password
				})
			} else {
				this.users[this.updatingIndex].username = this.username
				this.users[this.updatingIndex].password = this.password
			}
			this.cancel()
		},
		update: function (index, user) {
			this.updatingIndex = index

			this.isAdding = true
			this.username = user.username
			this.password = user.password

			let that = this
			setTimeout(function () {
				that.$refs.username.focus()
			}, 100)
		},
		remove: function (index) {
			this.users.$remove(index)
		}
	},
	template: `<div>
	<input type="hidden" name="httpAuthBasicAuthUsersJSON" :value="JSON.stringify(users)"/>
	<div v-if="users.length > 0">
		<div class="ui label small basic" v-for="(user, index) in users">
			{{user.username}} <a href="" title="修改" @click.prevent="update(index, user)"><i class="icon pencil tiny"></i></a>
			<a href="" title="删除" @click.prevent="remove(index)"><i class="icon remove small"></i></a>
		</div>
		<div class="ui divider"></div>
	</div>
	<div v-show="isAdding">
		<div class="ui fields inline">
			<div class="ui field">
				<input type="text" placeholder="用户名" v-model="username" size="15" ref="username"/>
			</div>
			<div class="ui field">
				<input type="password" placeholder="密码" v-model="password" size="15" ref="password"/>
			</div>
			<div class="ui field">
				<button class="ui button tiny" type="button" @click.prevent="confirm">确定</button>&nbsp;
				<a href="" title="取消" @click.prevent="cancel"><i class="icon remove small"></i></a>
			</div>
		</div>
	</div>
	<div v-if="!isAdding" style="margin-top: 1em">
		<button class="ui button tiny" type="button" @click.prevent="add">+</button>
	</div>
</div>`
})

// UAM模式配置
Vue.component("uam-config-box", {
	props: ["v-uam-config", "v-is-location", "v-is-group"],
	data: function () {
		let config = this.vUamConfig
		if (config == null) {
			config = {
				isPrior: false,
				isOn: false,
				addToWhiteList: true,
				onlyURLPatterns: [],
				exceptURLPatterns: [],
				minQPSPerIP: 0,
				keyLife: 0
			}
		}
		if (config.onlyURLPatterns == null) {
			config.onlyURLPatterns = []
		}
		if (config.exceptURLPatterns == null) {
			config.exceptURLPatterns = []
		}
		return {
			config: config,
			moreOptionsVisible: false,
			minQPSPerIP: config.minQPSPerIP,
			keyLife: config.keyLife
		}
	},
	watch: {
		minQPSPerIP: function (v) {
			let qps = parseInt(v.toString())
			if (isNaN(qps) || qps < 0) {
				qps = 0
			}
			this.config.minQPSPerIP = qps
		},
		keyLife: function (v) {
			let keyLife = parseInt(v)
			if (isNaN(keyLife) || keyLife <= 0) {
				keyLife = 0
			}
			this.config.keyLife = keyLife
		}
	},
	methods: {
		showMoreOptions: function () {
			this.moreOptionsVisible = !this.moreOptionsVisible
		},
		changeConds: function (conds) {
			this.config.conds = conds
		}
	},
	template: `<div>
<input type="hidden" name="uamJSON" :value="JSON.stringify(config)"/>
<table class="ui table definition selectable">
	<prior-checkbox :v-config="config" v-if="vIsLocation || vIsGroup"></prior-checkbox>
	<tbody v-show="((!vIsLocation && !vIsGroup) || config.isPrior)">
		<tr>
			<td class="title">启用5秒盾</td>
			<td>
				<checkbox v-model="config.isOn"></checkbox>
				<p class="comment"><plus-label></plus-label>启用后，访问网站时，自动检查浏览器环境，阻止非正常访问。</p>
			</td>
		</tr>
	</tbody>
	<tbody v-show="config.isOn">
		<tr>
			<td colspan="2"><more-options-indicator @change="showMoreOptions"></more-options-indicator></td>
		</tr>
	</tbody>
	<tbody v-show="moreOptionsVisible && config.isOn">
		<tr>
			<td>验证有效期</td>
			<td>
				<div class="ui input right labeled">
                     <input type="text" name="keyLife" v-model="keyLife" maxlength="6" size="6" style="width: 6em"/>
                     <span class="ui label">秒</span>
                </div>
                <p class="comment">单个客户端验证通过后，在这个有效期内不再重复验证；如果为0则表示系统默认。</p>
			</td>
		</tr>
		<tr>
			<td>单IP最低QPS</td>
			<td>
				<div class="ui input right labeled">
					<input type="text" name="minQPSPerIP" maxlength="6" style="width: 6em" v-model="minQPSPerIP"/>
					<span class="ui label">请求数/秒</span>
				</div>
				<p class="comment">当某个IP在1分钟内平均QPS达到此值时，才会触发5秒盾；如果设置为0，表示任何访问都会触发。</p>
			</td>
		</tr>
		<tr>
			<td>加入IP白名单</td>
			<td>
				<checkbox v-model="config.addToWhiteList"></checkbox>
				<p class="comment">选中后，表示验证通过后，将访问者IP加入到临时白名单中，此IP下次访问时不再校验5秒盾；此白名单只对5秒盾有效，不影响其他规则。此选项主要用于可能无法正常使用Cookie的网站。</p>
			</td>
		</tr>
		<tr>
			<td>例外URL</td>
			<td>
				<url-patterns-box v-model="config.exceptURLPatterns"></url-patterns-box>
				<p class="comment">如果填写了例外URL，表示这些URL跳过5秒盾不做处理。</p>
			</td>
		</tr>
		<tr>
			<td>限制URL</td>
			<td>
				<url-patterns-box v-model="config.onlyURLPatterns"></url-patterns-box>
				<p class="comment">如果填写了限制URL，表示只对这些URL进行5秒盾处理；如果不填则表示支持所有的URL。</p>
			</td>
		</tr>
		<tr>
			<td>匹配条件</td>
			<td>
				<http-request-conds-box :v-conds="config.conds" @change="changeConds"></http-request-conds-box>
			</td>
		</tr>
	</tbody>
</table>
<div class="margin"></div>
</div>`
})

Vue.component("http-websocket-box", {
	props: ["v-websocket-ref", "v-websocket-config", "v-is-location"],
	data: function () {
		let websocketRef = this.vWebsocketRef
		if (websocketRef == null) {
			websocketRef = {
				isPrior: false,
				isOn: false,
				websocketId: 0
			}
		}

		let websocketConfig = this.vWebsocketConfig
		if (websocketConfig == null) {
			websocketConfig = {
				id: 0,
				isOn: false,
				handshakeTimeout: {
					count: 30,
					unit: "second"
				},
				allowAllOrigins: true,
				allowedOrigins: [],
				requestSameOrigin: true,
				requestOrigin: ""
			}
		} else {
			if (websocketConfig.handshakeTimeout == null) {
				websocketConfig.handshakeTimeout = {
					count: 30,
					unit: "second",
				}
			}
			if (websocketConfig.allowedOrigins == null) {
				websocketConfig.allowedOrigins = []
			}
		}

		return {
			websocketRef: websocketRef,
			websocketConfig: websocketConfig,
			handshakeTimeoutCountString: websocketConfig.handshakeTimeout.count.toString(),
			advancedVisible: false
		}
	},
	watch: {
		handshakeTimeoutCountString: function (v) {
			let count = parseInt(v)
			if (!isNaN(count) && count >= 0) {
				this.websocketConfig.handshakeTimeout.count = count
			} else {
				this.websocketConfig.handshakeTimeout.count = 0
			}
		}
	},
	methods: {
		isOn: function () {
			return (!this.vIsLocation || this.websocketRef.isPrior) && this.websocketRef.isOn
		},
		changeAdvancedVisible: function (v) {
			this.advancedVisible = v
		},
		createOrigin: function () {
			let that = this
			teaweb.popup("/servers/server/settings/websocket/createOrigin", {
				height: "12.5em",
				callback: function (resp) {
					that.websocketConfig.allowedOrigins.push(resp.data.origin)
				}
			})
		},
		removeOrigin: function (index) {
			this.websocketConfig.allowedOrigins.$remove(index)
		}
	},
	template: `<div>
	<input type="hidden" name="websocketRefJSON" :value="JSON.stringify(websocketRef)"/>
	<input type="hidden" name="websocketJSON" :value="JSON.stringify(websocketConfig)"/>
	<table class="ui table definition selectable">
		<prior-checkbox :v-config="websocketRef" v-if="vIsLocation"></prior-checkbox>
		<tbody v-show="(!this.vIsLocation || this.websocketRef.isPrior)">
			<tr>
				<td class="title">启用Websocket</td>
				<td>
					<div class="ui checkbox">
						<input type="checkbox" v-model="websocketRef.isOn"/>
						<label></label>
					</div>
				</td>
			</tr>
		</tbody>
		<tbody v-show="isOn()">
			<tr>
				<td class="color-border">允许所有来源域<em>（Origin）</em></td>
				<td>
					<div class="ui checkbox">
						<input type="checkbox" v-model="websocketConfig.allowAllOrigins"/>
						<label></label>
					</div>
					<p class="comment">选中表示允许所有的来源域。</p>
				</td>
			</tr>
		</tbody>
		<tbody v-show="isOn() && !websocketConfig.allowAllOrigins">
			<tr>
				<td class="color-border">允许的来源域列表<em>（Origin）</em></td>
				<td>
					<div v-if="websocketConfig.allowedOrigins.length > 0">
						<div class="ui label small basic" v-for="(origin, index) in websocketConfig.allowedOrigins">
							{{origin}} <a href="" title="删除" @click.prevent="removeOrigin(index)"><i class="icon remove small"></i></a>
						</div>
						<div class="ui divider"></div>
					</div>
					<button class="ui button tiny" type="button" @click.prevent="createOrigin()">+</button>
					<p class="comment">只允许在列表中的来源域名访问Websocket服务。</p>
				</td>
			</tr>
		</tbody>
		<more-options-tbody @change="changeAdvancedVisible" v-show="isOn()"></more-options-tbody>
		<tbody v-show="isOn() && advancedVisible">
			<tr>
				<td class="color-border">传递请求来源域</td>
				<td>
					<div class="ui checkbox">
						<input type="checkbox" v-model="websocketConfig.requestSameOrigin"/>
						<label></label>
					</div>
					<p class="comment">选中后，表示把接收到的请求中的<code-label>Origin</code-label>字段传递到源站。</p>
				</td>
			</tr>
		</tbody>
		<tbody v-show="isOn() && advancedVisible && !websocketConfig.requestSameOrigin">
			<tr>
				<td class="color-border">指定传递的来源域</td>
				<td>
					<input type="text" v-model="websocketConfig.requestOrigin" maxlength="200"/>
					<p class="comment">指定向源站传递的<span class="ui label tiny">Origin</span>字段值。</p>
				</td>
			</tr>
		</tbody>
		<!-- TODO 这个选项暂时保留 -->
		<tbody v-show="isOn() && false">
			<tr>
				<td>握手超时时间<em>（Handshake）</em></td>
				<td>
					<div class="ui fields inline">
						<div class="ui field">
							<input type="text" maxlength="10" v-model="handshakeTimeoutCountString" style="width:6em"/>
						</div>
						<div class="ui field">
							秒
						</div>
					</div>
					<p class="comment">0表示使用默认的时间设置。</p>
				</td>
			</tr>
		</tbody>
	</table>
	<div class="margin"></div>
</div>`
})

Vue.component("http-host-redirect-box", {
	props: ["v-redirects"],
	mounted: function () {
		let that = this
		sortTable(function (ids) {
			let newRedirects = []
			ids.forEach(function (id) {
				that.redirects.forEach(function (redirect) {
					if (redirect.id == id) {
						newRedirects.push(redirect)
					}
				})
			})
			that.updateRedirects(newRedirects)
		})
	},
	data: function () {
		let redirects = this.vRedirects
		if (redirects == null) {
			redirects = []
		}

		let id = 0
		redirects.forEach(function (v) {
			id++
			v.id = id
		})

		return {
			redirects: redirects,
			statusOptions: [
				{"code": 301, "text": "Moved Permanently"},
				{"code": 308, "text": "Permanent Redirect"},
				{"code": 302, "text": "Found"},
				{"code": 303, "text": "See Other"},
				{"code": 307, "text": "Temporary Redirect"}
			],
			id: id
		}
	},
	methods: {
		add: function () {
			let that = this
			window.UPDATING_REDIRECT = null

			teaweb.popup("/servers/server/settings/redirects/createPopup", {
				width: "50em",
				height: "36em",
				callback: function (resp) {
					that.id++
					resp.data.redirect.id = that.id
					that.redirects.push(resp.data.redirect)
					that.change()
				}
			})
		},
		update: function (index, redirect) {
			let that = this
			window.UPDATING_REDIRECT = redirect

			teaweb.popup("/servers/server/settings/redirects/createPopup", {
				width: "50em",
				height: "36em",
				callback: function (resp) {
					resp.data.redirect.id = redirect.id
					Vue.set(that.redirects, index, resp.data.redirect)
					that.change()
				}
			})
		},
		remove: function (index) {
			let that = this
			teaweb.confirm("确定要删除这条跳转规则吗？", function () {
				that.redirects.$remove(index)
				that.change()
			})
		},
		change: function () {
			let that = this
			setTimeout(function (){
				that.$emit("change", that.redirects)
			}, 100)
		},
		updateRedirects: function (newRedirects) {
			this.redirects = newRedirects
			this.change()
		}
	},
	template: `<div>
	<input type="hidden" name="hostRedirectsJSON" :value="JSON.stringify(redirects)"/>
	
	<first-menu>
		<menu-item @click.prevent="add">[创建]</menu-item>
	</first-menu>
	<div class="margin"></div>

	<p class="comment" v-if="redirects.length == 0">暂时还没有URL跳转规则。</p>
	<div v-show="redirects.length > 0">
		<table class="ui table celled selectable" id="sortable-table">
			<thead>
				<tr>
					<th style="width: 1em"></th>
					<th>跳转前</th>
					<th style="width: 1em"></th>
					<th>跳转后</th>
					<th>HTTP状态码</th>
					<th class="two wide">状态</th>
					<th class="two op">操作</th>
				</tr>
			</thead>
			<tbody v-for="(redirect, index) in redirects" :key="redirect.id" :v-id="redirect.id">
				<tr>
					<td style="text-align: center;"><i class="icon bars handle grey"></i> </td>
					<td>
						<div v-if="redirect.type == '' || redirect.type == 'url'">
							{{redirect.beforeURL}}
							<div style="margin-top: 0.4em">
								<grey-label><strong>URL跳转</strong></grey-label>
								<grey-label v-if="redirect.matchPrefix">匹配前缀</grey-label>
								<grey-label v-if="redirect.matchRegexp">正则匹配</grey-label>
								<grey-label v-if="!redirect.matchPrefix && !redirect.matchRegexp">精准匹配</grey-label>
								<grey-label v-if="redirect.exceptDomains != null && redirect.exceptDomains.length > 0" v-for="domain in redirect.exceptDomains">排除:{{domain}}</grey-label>
								<grey-label v-if="redirect.onlyDomains != null && redirect.onlyDomains.length > 0" v-for="domain in redirect.onlyDomains">仅限:{{domain}}</grey-label>
							</div>
						</div>
						<div v-if="redirect.type == 'domain'">
							<span v-if="redirect.domainsAll">所有域名</span>
							<span v-if="!redirect.domainsAll && redirect.domainsBefore != null">
								<span v-if="redirect.domainsBefore.length == 1">{{redirect.domainsBefore[0]}}</span>
								<span v-if="redirect.domainsBefore.length > 1">{{redirect.domainsBefore[0]}}等{{redirect.domainsBefore.length}}个域名</span>
							</span>
							<div style="margin-top: 0.4em">
								<grey-label><strong>域名跳转</strong></grey-label>
								<grey-label v-if="redirect.domainAfterScheme != null && redirect.domainAfterScheme.length > 0">{{redirect.domainAfterScheme}}</grey-label>
								<grey-label v-if="redirect.domainBeforeIgnorePorts">忽略端口</grey-label>
							</div>
						</div>
						<div v-if="redirect.type == 'port'">
							<span v-if="redirect.portsAll">所有端口</span>
							<span v-if="!redirect.portsAll && redirect.portsBefore != null">
								<span v-if="redirect.portsBefore.length <= 5">{{redirect.portsBefore.join(", ")}}</span>
								<span v-if="redirect.portsBefore.length > 5">{{redirect.portsBefore.slice(0, 5).join(", ")}}等{{redirect.portsBefore.length}}个端口</span>
							</span>
							<div style="margin-top: 0.4em">
								<grey-label><strong>端口跳转</strong></grey-label>
								<grey-label v-if="redirect.portAfterScheme != null && redirect.portAfterScheme.length > 0">{{redirect.portAfterScheme}}</grey-label>
							</div>
						</div>
						
						<div style="margin-top: 0.5em" v-if="redirect.conds != null && redirect.conds.groups != null && redirect.conds.groups.length > 0">
							<grey-label>匹配条件</grey-label>
						</div>
					</td>
					<td nowrap="">-&gt;</td>
					<td>
						<span v-if="redirect.type == '' || redirect.type == 'url'">{{redirect.afterURL}}</span>
						<span v-if="redirect.type == 'domain'">{{redirect.domainAfter}}</span>
						<span v-if="redirect.type == 'port'">{{redirect.portAfter}}</span>
					</td>
					<td>
						<span v-if="redirect.status > 0">{{redirect.status}}</span>
						<span v-else class="disabled">默认</span>
					</td>
					<td><label-on :v-is-on="redirect.isOn"></label-on></td>
					<td>
						<a href="" @click.prevent="update(index, redirect)">修改</a> &nbsp;
						<a href="" @click.prevent="remove(index)">删除</a>	
					</td>
				</tr>
			</tbody>
		</table>
		<p class="comment" v-if="redirects.length > 1">所有规则匹配顺序为从上到下，可以拖动左侧的<i class="icon bars"></i>排序。</p>
	</div>
	<div class="margin"></div>
</div>`
})

// 单个缓存条件设置
Vue.component("http-cache-ref-box", {
	props: ["v-cache-ref", "v-is-reverse"],
	mounted: function () {
		this.$refs.variablesDescriber.update(this.ref.key)
		if (this.ref.simpleCond != null) {
			this.condType = this.ref.simpleCond.type
			this.changeCondType(this.ref.simpleCond.type, true)
			this.condCategory = "simple"
		} else if (this.ref.conds != null && this.ref.conds.groups != null) {
			this.condCategory = "complex"
		}
		this.changeCondCategory(this.condCategory)
	},
	data: function () {
		let ref = this.vCacheRef
		if (ref == null) {
			ref = {
				isOn: true,
				cachePolicyId: 0,
				key: "${scheme}://${host}${requestPath}${isArgs}${args}",
				life: {count: 1, unit: "day"},
				status: [200],
				maxSize: {count: 128, unit: "mb"},
				minSize: {count: 0, unit: "kb"},
				skipCacheControlValues: ["private", "no-cache", "no-store"],
				skipSetCookie: true,
				enableRequestCachePragma: false,
				conds: null, // 复杂条件
				simpleCond: null, // 简单条件
				allowChunkedEncoding: true,
				allowPartialContent: true,
				forcePartialContent: false,
				enableIfNoneMatch: false,
				enableIfModifiedSince: false,
				enableReadingOriginAsync: false,
				isReverse: this.vIsReverse,
				methods: [],
				expiresTime: {
					isPrior: false,
					isOn: false,
					overwrite: true,
					autoCalculate: true,
					duration: {count: -1, "unit": "hour"}
				}
			}
		}
		if (ref.key == null) {
			ref.key = ""
		}
		if (ref.methods == null) {
			ref.methods = []
		}

		if (ref.life == null) {
			ref.life = {count: 2, unit: "hour"}
		}
		if (ref.maxSize == null) {
			ref.maxSize = {count: 32, unit: "mb"}
		}
		if (ref.minSize == null) {
			ref.minSize = {count: 0, unit: "kb"}
		}

		let condType = "url-extension"
		let condComponent = window.REQUEST_COND_COMPONENTS.$find(function (k, v) {
			return v.type == "url-extension"
		})

		return {
			ref: ref,

			keyIgnoreArgs: typeof ref.key == "string" && ref.key.indexOf("${args}") < 0,

			moreOptionsVisible: false,

			condCategory: "simple", // 条件分类：simple|complex
			condType: condType,
			condComponent: condComponent,
			condIsCaseInsensitive: (ref.simpleCond != null) ? ref.simpleCond.isCaseInsensitive : true,

			components: window.REQUEST_COND_COMPONENTS
		}
	},
	watch: {
		keyIgnoreArgs: function (b) {
			if (typeof this.ref.key != "string") {
				return
			}
			if (b) {
				this.ref.key = this.ref.key.replace("${isArgs}${args}", "")
				return;
			}
			if (this.ref.key.indexOf("${isArgs}") < 0) {
				this.ref.key = this.ref.key + "${isArgs}"
			}
			if (this.ref.key.indexOf("${args}") < 0) {
				this.ref.key = this.ref.key + "${args}"
			}
		}
	},
	methods: {
		changeOptionsVisible: function (v) {
			this.moreOptionsVisible = v
		},
		changeLife: function (v) {
			this.ref.life = v
		},
		changeMaxSize: function (v) {
			this.ref.maxSize = v
		},
		changeMinSize: function (v) {
			this.ref.minSize = v
		},
		changeConds: function (v) {
			this.ref.conds = v
			this.ref.simpleCond = null
		},
		changeStatusList: function (list) {
			let result = []
			list.forEach(function (status) {
				let statusNumber = parseInt(status)
				if (isNaN(statusNumber) || statusNumber < 100 || statusNumber > 999) {
					return
				}
				result.push(statusNumber)
			})
			this.ref.status = result
		},
		changeMethods: function (methods) {
			this.ref.methods = methods.map(function (v) {
				return v.toUpperCase()
			})
		},
		changeKey: function (key) {
			this.$refs.variablesDescriber.update(key)
		},
		changeExpiresTime: function (expiresTime) {
			this.ref.expiresTime = expiresTime
		},

		// 切换条件类型
		changeCondCategory: function (condCategory) {
			this.condCategory = condCategory

			// resize window
			let dialog = window.parent.document.querySelector("*[role='dialog']")
			if (dialog == null) {
				return
			}
			switch (condCategory) {
				case "simple":
					dialog.style.width = "45em"
					break
				case "complex":
					let width = window.parent.innerWidth
					if (width > 1024) {
						width = 1024
					}

					dialog.style.width = width + "px"
					if (this.ref.conds != null) {
						this.ref.conds.isOn = true
					}
					break
			}
		},
		changeCondType: function (condType, isInit) {
			if (!isInit && this.ref.simpleCond != null) {
				this.ref.simpleCond.value = null
			}
			let def = this.components.$find(function (k, component) {
				return component.type == condType
			})
			if (def != null) {
				this.condComponent = def
			}
		}
	},
	template: `<tbody>
	<tr v-if="condCategory == 'simple'">
		<td class="title">缓存对象 *</td>
		<td>
			<select class="ui dropdown auto-width" name="condType" v-model="condType" @change="changeCondType(condType, false)">
				<option value="url-extension">文件扩展名</option>
				<option value="url-eq-index">首页</option>
				<option value="url-all">全站</option>
				<option value="url-prefix">URL目录前缀</option>
				<option value="url-eq">URL完整路径</option>
				<option value="url-wildcard-match">URL通配符</option>
				<option value="url-regexp">URL正则匹配</option>
				<option value="params">参数匹配</option>
			</select>
			<p class="comment"><a href="" @click.prevent="changeCondCategory('complex')">切换到复杂条件 &raquo;</a></p>
		</td>
	</tr>
	<tr v-if="condCategory == 'simple'">
		<td>{{condComponent.paramsTitle}} *</td>
		<td>
			<component :is="condComponent.component" :v-cond="ref.simpleCond" v-if="condComponent.type != 'params'"></component>
			<table class="ui table" v-if="condComponent.type == 'params'">
				<component :is="condComponent.component" :v-cond="ref.simpleCond"></component>
			</table>
		</td>
	</tr>
	<tr v-if="condCategory == 'simple' && condComponent.caseInsensitive">
		<td>不区分大小写</td>
		<td>
			<div class="ui checkbox">
				<input type="checkbox" name="condIsCaseInsensitive" value="1" v-model="condIsCaseInsensitive"/>
				<label></label>
			</div>
			<p class="comment">选中后表示对比时忽略参数值的大小写。</p>
		</td>
	</tr>
	<tr v-if="condCategory == 'complex'">
		<td class="title">匹配条件分组 *</td>
		<td>
			<http-request-conds-box :v-conds="ref.conds" @change="changeConds"></http-request-conds-box>
			<p class="comment"><a href="" @click.prevent="changeCondCategory('simple')">&laquo; 切换到简单条件</a></p>
		</td>
	</tr>
	<tr v-show="!vIsReverse">
		<td>缓存有效期 *</td>
		<td>
			<time-duration-box :v-value="ref.life" @change="changeLife" :v-min-unit="'minute'" maxlength="4"></time-duration-box>
		</td>
	</tr>
	<tr v-show="!vIsReverse">
		<td>忽略URI参数</td>
		<td>
			<checkbox v-model="keyIgnoreArgs"></checkbox>
			<p class="comment">选中后，表示缓存Key中不包含URI参数（即问号（?））后面的内容。</p>
		</td>
	</tr>
	<tr v-show="!vIsReverse">
		<td colspan="2"><more-options-indicator @change="changeOptionsVisible"></more-options-indicator></td>
	</tr>
	<tr v-show="moreOptionsVisible && !vIsReverse">
		<td>缓存Key *</td>
		<td>
			<input type="text" v-model="ref.key" @input="changeKey(ref.key)"/>
			<p class="comment">用来区分不同缓存内容的唯一Key。<request-variables-describer ref="variablesDescriber"></request-variables-describer>。</p>
		</td>
	</tr>
	<tr v-show="moreOptionsVisible && !vIsReverse">
		<td>请求方法限制</td>
		<td>
			<values-box size="5" maxlength="10" :values="ref.methods" @change="changeMethods"></values-box>
			<p class="comment">允许请求的缓存方法，默认支持所有的请求方法。</p>
		</td>
	</tr>
	<tr v-show="moreOptionsVisible && !vIsReverse">
		<td>客户端过期时间<em>（Expires）</em></td>
		<td>
			<http-expires-time-config-box :v-expires-time="ref.expiresTime" @change="changeExpiresTime"></http-expires-time-config-box>		
		</td>
	</tr>
	<tr v-show="moreOptionsVisible && !vIsReverse">
		<td>可缓存的最大内容尺寸</td>
		<td>
			<size-capacity-box :v-value="ref.maxSize" @change="changeMaxSize"></size-capacity-box>
			<p class="comment">内容尺寸如果高于此值则不缓存。</p>
		</td>
	</tr>
	<tr v-show="moreOptionsVisible && !vIsReverse">
		<td>可缓存的最小内容尺寸</td>
		<td>
			<size-capacity-box :v-value="ref.minSize" @change="changeMinSize"></size-capacity-box>
			<p class="comment">内容尺寸如果低于此值则不缓存。</p>
		</td>
	</tr>
	<tr v-show="moreOptionsVisible && !vIsReverse">
		<td>支持缓存分片内容</td>
		<td>
			<checkbox name="allowPartialContent" value="1" v-model="ref.allowPartialContent"></checkbox>
			<p class="comment">选中后，支持缓存源站返回的某个分片的内容，该内容通过<code-label>206 Partial Content</code-label>状态码返回。</p>
		</td>
	</tr>
	<tr v-show="moreOptionsVisible && !vIsReverse && ref.allowPartialContent && !ref.alwaysForwardRangeReques">
		<td>强制返回分片内容</td>
		<td>
			<checkbox name="forcePartialContent" value="1" v-model="ref.forcePartialContent"></checkbox>
			<p class="comment">选中后，表示无论客户端是否发送<code-label>Range</code-label>报头，都会优先尝试返回已缓存的分片内容；如果你的应用有不支持分片内容的客户端（比如有些下载软件不支持<code-label>206 Partial Content</code-label>），请务必关闭此功能。</p>
		</td>
	</tr>
	<tr v-show="moreOptionsVisible && !vIsReverse">
		<td>强制Range回源</td>
		<td>
			<checkbox v-model="ref.alwaysForwardRangeRequest"></checkbox>
			<p class="comment">选中后，表示把所有包含Range报头的请求都转发到源站，而不是尝试从缓存中读取。</p>
		</td>
	</tr>
	<tr v-show="moreOptionsVisible && !vIsReverse">
		<td>状态码列表</td>
		<td>
			<values-box name="statusList" size="3" maxlength="3" :values="ref.status" @change="changeStatusList"></values-box>
			<p class="comment">允许缓存的HTTP状态码列表。</p>
		</td>
	</tr>
	<tr v-show="moreOptionsVisible && !vIsReverse">
		<td>跳过的Cache-Control值</td>
		<td>
			<values-box name="skipResponseCacheControlValues" size="10" maxlength="100" :values="ref.skipCacheControlValues"></values-box>
			<p class="comment">当响应的Cache-Control为这些值时不缓存响应内容，而且不区分大小写。</p>
		</td>
	</tr>
	<tr v-show="moreOptionsVisible && !vIsReverse">
		<td>跳过Set-Cookie</td>
		<td>
			<div class="ui checkbox">
				<input type="checkbox" value="1" v-model="ref.skipSetCookie"/>
				<label></label>
			</div>
			<p class="comment">选中后，当响应的报头中有Set-Cookie时不缓存响应内容，防止动态内容被缓存。</p>
		</td>
	</tr>
	<tr v-show="moreOptionsVisible && !vIsReverse">
		<td>支持请求no-cache刷新</td>
		<td>
			<div class="ui checkbox">
				<input type="checkbox" name="enableRequestCachePragma" value="1" v-model="ref.enableRequestCachePragma"/>
				<label></label>
			</div>
			<p class="comment">选中后，当请求的报头中含有Pragma: no-cache或Cache-Control: no-cache时，会跳过缓存直接读取源内容，一般仅用于调试。</p>
		</td>
	</tr>	
	<tr v-show="moreOptionsVisible && !vIsReverse">
		<td>允许If-None-Match回源</td>
		<td>
			<checkbox v-model="ref.enableIfNoneMatch"></checkbox>
			<p class="comment">特殊情况下才需要开启，可能会降低缓存命中率。</p>
		</td>
	</tr>
	<tr v-show="moreOptionsVisible && !vIsReverse">
		<td>允许If-Modified-Since回源</td>
		<td>
			<checkbox v-model="ref.enableIfModifiedSince"></checkbox>
			<p class="comment">特殊情况下才需要开启，可能会降低缓存命中率。</p>
		</td>
	</tr>
	<tr v-show="moreOptionsVisible && !vIsReverse">
		<td>允许异步读取源站</td>
		<td>
			<checkbox v-model="ref.enableReadingOriginAsync"></checkbox>
			<p class="comment">试验功能。允许客户端中断连接后，仍然继续尝试从源站读取内容并缓存。</p>
		</td>
	</tr>
	<tr v-show="moreOptionsVisible && !vIsReverse">
		<td>支持分段内容</td>
		<td>
			<checkbox name="allowChunkedEncoding" value="1" v-model="ref.allowChunkedEncoding"></checkbox>
			<p class="comment">选中后，Gzip等压缩后的Chunked内容可以直接缓存，无需检查内容长度。</p>
		</td>
	</tr>
	<tr v-show="false">
		<td colspan="2"><input type="hidden" name="cacheRefJSON" :value="JSON.stringify(ref)"/></td>
	</tr>
</tbody>`
})

Vue.component("http-firewall-region-selector", {
	props: ["v-type", "v-countries"],
	data: function () {
		let countries = this.vCountries
		if (countries == null) {
			countries = []
		}

		return {
			listType: this.vType,
			countries: countries
		}
	},
	methods: {
		addCountry: function () {
			let selectedCountryIds = this.countries.map(function (country) {
				return country.id
			})
			let that = this
			teaweb.popup("/servers/server/settings/waf/ipadmin/selectCountriesPopup?type=" + this.listType + "&selectedCountryIds=" + selectedCountryIds.join(","), {
				width: "52em",
				height: "30em",
				callback: function (resp) {
					that.countries = resp.data.selectedCountries
					that.$forceUpdate()
					that.notifyChange()
				}
			})
		},
		removeCountry: function (index) {
			this.countries.$remove(index)
			this.notifyChange()
		},
		resetCountries: function () {
			this.countries = []
			this.notifyChange()
		},
		notifyChange: function () {
			this.$emit("change", {
				"countries": this.countries
			})
		}
	},
	template: `<div>
	<span v-if="countries.length == 0" class="disabled">暂时没有选择<span v-if="listType =='allow'">允许</span><span v-else>封禁</span>的区域。</span>
	<div v-show="countries.length > 0">
		<div class="ui label tiny basic" v-for="(country, index) in countries" style="margin-bottom: 0.5em">
			<input type="hidden" :name="listType + 'CountryIds'" :value="country.id"/>
			({{country.letter}}){{country.name}} <a href="" @click.prevent="removeCountry(index)" title="删除"><i class="icon remove"></i></a>
		</div>
	</div>
	<div class="ui divider"></div>
	<button type="button" class="ui button tiny" @click.prevent="addCountry">修改</button> &nbsp; <button type="button" class="ui button tiny" v-show="countries.length > 0" @click.prevent="resetCountries">清空</button>
</div>`
})

Vue.component("script-config-box", {
	props: ["id", "v-script-config", "comment", "v-auditing-status"],
	data: function () {
		let config = this.vScriptConfig
		if (config == null) {
			config = {
				isPrior: false,
				isOn: false,
				code: "",
				auditingCode: ""
			}
		}

		let auditingStatus = null
		if (config.auditingCodeMD5 != null && config.auditingCodeMD5.length > 0 && config.auditingCode != null && config.auditingCode.length > 0) {
			config.code = config.auditingCode

			if (this.vAuditingStatus != null) {
				for (let i = 0; i < this.vAuditingStatus.length; i ++ ){
					let status = this.vAuditingStatus[i]
					if (status.md5 == config.auditingCodeMD5) {
						auditingStatus = status
						break
					}
				}
			}
		}

		if (config.code.length == 0) {
			config.code = "\n\n\n\n"
		}

		return {
			config: config,
			auditingStatus: auditingStatus
		}
	},
	watch: {
		"config.isOn": function () {
			this.change()
		}
	},
	methods: {
		change: function () {
			this.$emit("change", this.config)
		},
		changeCode: function (code) {
			this.config.code = code
			this.change()
		}
	},
	template: `<div>
	<table class="ui table definition selectable">
		<tbody>
			<tr>
				<td class="title">启用脚本设置</td>
				<td><checkbox v-model="config.isOn"></checkbox></td>
			</tr>
		</tbody>
		<tbody>
			<tr :style="{opacity: !config.isOn ? 0.5 : 1}">
				<td>脚本代码</td>	
				<td>
					<p class="comment" v-if="auditingStatus != null">
						<span class="green" v-if="auditingStatus.isPassed">管理员审核结果：审核通过。</span>
						<span class="red" v-else-if="auditingStatus.isRejected">管理员审核结果：驳回 &nbsp; &nbsp; 驳回理由：{{auditingStatus.rejectedReason}}</span>
						<span class="red" v-else>当前脚本将在审核后生效，请耐心等待审核结果。</span>
					</p>
					<p class="comment" v-if="auditingStatus == null"><span class="green">管理员审核结果：审核通过。</span></p>
					<source-code-box :id="id" type="text/javascript" :read-only="false" @change="changeCode">{{config.code}}</source-code-box>
					<p class="comment">{{comment}}</p>
				</td>
			</tr>
		</tbody>
	</table>
</div>`
})

// 请求限制
Vue.component("http-request-limit-config-box", {
	props: ["v-request-limit-config", "v-is-group", "v-is-location"],
	data: function () {
		let config = this.vRequestLimitConfig
		if (config == null) {
			config = {
				isPrior: false,
				isOn: false,
				maxConns: 0,
				maxConnsPerIP: 0,
				maxBodySize: {
					count: -1,
					unit: "kb"
				},
				outBandwidthPerConn: {
					count: -1,
					unit: "kb"
				}
			}
		}
		return {
			config: config,
			maxConns: config.maxConns,
			maxConnsPerIP: config.maxConnsPerIP
		}
	},
	watch: {
		maxConns: function (v) {
			let conns = parseInt(v, 10)
			if (isNaN(conns)) {
				this.config.maxConns = 0
				return
			}
			if (conns < 0) {
				this.config.maxConns = 0
			} else {
				this.config.maxConns = conns
			}
		},
		maxConnsPerIP: function (v) {
			let conns = parseInt(v, 10)
			if (isNaN(conns)) {
				this.config.maxConnsPerIP = 0
				return
			}
			if (conns < 0) {
				this.config.maxConnsPerIP = 0
			} else {
				this.config.maxConnsPerIP = conns
			}
		}
	},
	methods: {
		isOn: function () {
			return ((!this.vIsLocation && !this.vIsGroup) || this.config.isPrior) && this.config.isOn
		}
	},
	template: `<div>
	<input type="hidden" name="requestLimitJSON" :value="JSON.stringify(config)"/>
	<table class="ui table selectable definition">
		<prior-checkbox :v-config="config" v-if="vIsLocation || vIsGroup"></prior-checkbox>
		<tbody v-show="(!vIsLocation && !vIsGroup) || config.isPrior">
			<tr>
				<td class="title">启用请求限制</td>
				<td>
					<checkbox v-model="config.isOn"></checkbox>
				</td>
			</tr>
		</tbody>
		<tbody v-show="isOn()">
			<tr>
				<td>最大并发连接数</td>
				<td>
					<input type="text" maxlength="6" v-model="maxConns"/>
					<p class="comment">当前网站最大并发连接数，超出此限制则响应用户<code-label>429</code-label>代码。为0表示不限制。</p>
				</td>
			</tr>
			<tr>
				<td>单IP最大并发连接数</td>
				<td>
					<input type="text" maxlength="6" v-model="maxConnsPerIP"/>
					<p class="comment">单IP最大连接数，统计单个IP总连接数时不区分服务，超出此限制则响应用户<code-label>429</code-label>代码。为0表示不限制。<span v-if="maxConnsPerIP <= 3" class="red">当前设置的并发连接数过低，可能会影响正常用户访问，建议不小于3。</span></p>
				</td>
			</tr>
			<tr>
				<td>单连接带宽限制</td>
				<td>
					<size-capacity-box :v-value="config.outBandwidthPerConn" :v-supported-units="['byte', 'kb', 'mb']"></size-capacity-box>
					<p class="comment">客户端单个请求每秒可以读取的下行流量。</p>
				</td>
			</tr>
			<tr>
				<td>单请求最大尺寸</td>
				<td>
					<size-capacity-box :v-value="config.maxBodySize" :v-supported-units="['byte', 'kb', 'mb', 'gb']"></size-capacity-box>
					<p class="comment">单个请求能发送的最大内容尺寸。</p>
				</td>
			</tr>
		</tbody>
	</table>
	<div class="margin"></div>
</div>`
})

// 指标对象
Vue.component("metric-keys-config-box", {
	props: ["v-keys"],
	data: function () {
		let keys = this.vKeys
		if (keys == null) {
			keys = []
		}
		return {
			keys: keys,
			isAdding: false,
			key: "",
			subKey: "",
			keyDescription: "",

			keyDefs: window.METRIC_HTTP_KEYS
		}
	},
	watch: {
		keys: function () {
			this.$emit("change", this.keys)
		}
	},
	methods: {
		cancel: function () {
			this.key = ""
			this.subKey = ""
			this.keyDescription = ""
			this.isAdding = false
		},
		confirm: function () {
			if (this.key.length == 0) {
				return
			}

			if (this.key.indexOf(".NAME") > 0) {
				if (this.subKey.length == 0) {
					teaweb.warn("请输入参数值")
					return
				}
				this.key = this.key.replace(".NAME", "." + this.subKey)
			}
			this.keys.push(this.key)
			this.cancel()
		},
		add: function () {
			this.isAdding = true
			let that = this
			setTimeout(function () {
				if (that.$refs.key != null) {
					that.$refs.key.focus()
				}
			}, 100)
		},
		remove: function (index) {
			this.keys.$remove(index)
		},
		changeKey: function () {
			if (this.key.length == 0) {
				return
			}
			let that = this
			let def = this.keyDefs.$find(function (k, v) {
				return v.code == that.key
			})
			if (def != null) {
				this.keyDescription = def.description
			}
		},
		keyName: function (key) {
			let that = this
			let subKey = ""
			let def = this.keyDefs.$find(function (k, v) {
				if (v.code == key) {
					return true
				}
				if (key.startsWith("${arg.") && v.code.startsWith("${arg.")) {
					subKey = that.getSubKey("arg.", key)
					return true
				}
				if (key.startsWith("${header.") && v.code.startsWith("${header.")) {
					subKey = that.getSubKey("header.", key)
					return true
				}
				if (key.startsWith("${cookie.") && v.code.startsWith("${cookie.")) {
					subKey = that.getSubKey("cookie.", key)
					return true
				}
				return false
			})
			if (def != null) {
				if (subKey.length > 0) {
					return def.name + ": " + subKey
				}
				return def.name
			}
			return key
		},
		getSubKey: function (prefix, key) {
			prefix = "${" + prefix
			let index = key.indexOf(prefix)
			if (index >= 0) {
				key = key.substring(index + prefix.length)
				key = key.substring(0, key.length - 1)
				return key
			}
			return ""
		}
	},
	template: `<div>
	<input type="hidden" name="keysJSON" :value="JSON.stringify(keys)"/>
	<div>
		<div v-for="(key, index) in keys" class="ui label small basic">
			{{keyName(key)}} &nbsp; <a href="" title="删除" @click.prevent="remove(index)"><i class="icon remove small"></i></a>
		</div>
	</div>
	<div v-if="isAdding" style="margin-top: 1em">
		<div class="ui fields inline">
			<div class="ui field">
				<select class="ui dropdown" v-model="key" @change="changeKey">
					<option value="">[选择对象]</option>
					<option v-for="def in keyDefs" :value="def.code">{{def.name}}</option>
				</select>
			</div>
			<div class="ui field" v-if="key == '\${arg.NAME}'">
				<input type="text" v-model="subKey" placeholder="参数名" size="15"/>
			</div>
			<div class="ui field" v-if="key == '\${header.NAME}'">
				<input type="text" v-model="subKey" placeholder="Header名" size="15">
			</div>
			<div class="ui field" v-if="key == '\${cookie.NAME}'">
				<input type="text" v-model="subKey" placeholder="Cookie名" size="15">
			</div>
			<div class="ui field">
				<button type="button" class="ui button tiny" @click.prevent="confirm">确定</button>
				<a href="" @click.prevent="cancel"><i class="icon remove small"></i></a>
			</div>
		</div>
		<p class="comment" v-if="keyDescription.length > 0">{{keyDescription}}</p>
	</div>
	<div style="margin-top: 1em" v-if="!isAdding">
		<button type="button" class="ui button tiny" @click.prevent="add">+</button>
	</div>
</div>`
})

Vue.component("http-expires-time-config-box", {
	props: ["v-expires-time"],
	data: function () {
		let expiresTime = this.vExpiresTime
		if (expiresTime == null) {
			expiresTime = {
				isPrior: false,
				isOn: false,
				overwrite: true,
				autoCalculate: true,
				duration: {count: -1, "unit": "hour"}
			}
		}
		return {
			expiresTime: expiresTime
		}
	},
	watch: {
		"expiresTime.isPrior": function () {
			this.notifyChange()
		},
		"expiresTime.isOn": function () {
			this.notifyChange()
		},
		"expiresTime.overwrite": function () {
			this.notifyChange()
		},
		"expiresTime.autoCalculate": function () {
			this.notifyChange()
		}
	},
	methods: {
		notifyChange: function () {
			this.$emit("change", this.expiresTime)
		}
	},
	template: `<div>
	<table class="ui table">
		<prior-checkbox :v-config="expiresTime"></prior-checkbox>
		<tbody v-show="expiresTime.isPrior">
			<tr>
				<td class="title">启用</td>
				<td><checkbox v-model="expiresTime.isOn"></checkbox>
					<p class="comment">启用后，将会在响应的Header中添加<code-label>Expires</code-label>字段，浏览器据此会将内容缓存在客户端；同时，在管理后台执行清理缓存时，也将无法清理客户端已有的缓存。</p>
				</td>
			</tr>
			<tr v-show="expiresTime.isPrior && expiresTime.isOn">
				<td>覆盖源站设置</td>
				<td>
					<checkbox v-model="expiresTime.overwrite"></checkbox>
					<p class="comment">选中后，会覆盖源站Header中已有的<code-label>Expires</code-label>字段。</p>
				</td>
			</tr>
			<tr v-show="expiresTime.isPrior && expiresTime.isOn">
				<td>自动计算时间</td>
				<td><checkbox v-model="expiresTime.autoCalculate"></checkbox>
					<p class="comment">根据已设置的缓存有效期进行计算。</p>
				</td>
			</tr>
			<tr v-show="expiresTime.isPrior && expiresTime.isOn && !expiresTime.autoCalculate">
				<td>强制缓存时间</td>
				<td>
					<time-duration-box :v-value="expiresTime.duration" @change="notifyChange"></time-duration-box>
					<p class="comment">从客户端访问的时间开始要缓存的时长。</p>
				</td>
			</tr>
		</tbody>
	</table>
</div>`
})

Vue.component("reverse-proxy-box", {
    props: ["v-reverse-proxy-ref", "v-reverse-proxy-config", "v-is-location", "v-family"],
    data: function () {
        let reverseProxyRef = this.vReverseProxyRef
        if (reverseProxyRef == null) {
            reverseProxyRef = {
                isPrior: false,
                isOn: false,
                reverseProxyId: 0
            }
        }

        let reverseProxyConfig = this.vReverseProxyConfig
        if (reverseProxyConfig == null) {
            reverseProxyConfig = {
                requestPath: "",
                stripPrefix: "",
                requestURI: "",
                requestHost: "",
                requestHostType: 0,
                addHeaders: [],
				requestHostExcludingPort: false,
				retry50X: false
            }
        } else if (reverseProxyConfig.addHeaders == null) {
            reverseProxyConfig.addHeaders = []
        }

		if (reverseProxyConfig.proxyProtocol == null) {
			// 如果直接赋值Vue将不会触发变更通知
			Vue.set(reverseProxyConfig, "proxyProtocol", {
				isOn: false,
				version: 1
			})
		}

        let forwardHeaders = [
            {
                name: "X-Real-IP",
                isChecked: false
            },
            {
                name: "X-Forwarded-For",
                isChecked: false
            },
            {
                name: "X-Forwarded-By",
                isChecked: false
            },
            {
                name: "X-Forwarded-Host",
                isChecked: false
            },
            {
                name: "X-Forwarded-Proto",
                isChecked: false
            }
        ]
        forwardHeaders.forEach(function (v) {
            v.isChecked = reverseProxyConfig.addHeaders.$contains(v.name)
        })

        return {
            reverseProxyRef: reverseProxyRef,
            reverseProxyConfig: reverseProxyConfig,
            advancedVisible: false,
            forwardHeaders: forwardHeaders,
			family: this.vFamily
        }
    },
    watch: {
        "reverseProxyConfig.requestHostType": function (v) {
            let requestHostType = parseInt(v)
            if (isNaN(requestHostType)) {
                requestHostType = 0
            }
            this.reverseProxyConfig.requestHostType = requestHostType
        }
    },
    methods: {
        isOn: function () {
            return (!this.vIsLocation || this.reverseProxyRef.isPrior) && this.reverseProxyRef.isOn
        },
        changeAdvancedVisible: function (v) {
            this.advancedVisible = v
        },
        changeAddHeader: function () {
            this.reverseProxyConfig.addHeaders = this.forwardHeaders.filter(function (v) {
                return v.isChecked
            }).map(function (v) {
                return v.name
            })
        }
    },
    template: `<div>
	<input type="hidden" name="reverseProxyRefJSON" :value="JSON.stringify(reverseProxyRef)"/>
	<input type="hidden" name="reverseProxyJSON" :value="JSON.stringify(reverseProxyConfig)"/>
	<table class="ui table selectable definition">
		<prior-checkbox :v-config="reverseProxyRef" v-if="vIsLocation"></prior-checkbox>
		<tbody v-show="!vIsLocation || reverseProxyRef.isPrior">
			<tr>
				<td class="title">启用源站</td>
				<td>
					<div class="ui checkbox">
						<input type="checkbox" v-model="reverseProxyRef.isOn"/>
						<label></label>
					</div>
				</td>
			</tr>
			<tr v-show="family == null || family == 'http'">
				<td>回源主机名<em>（Host）</em></td>
				<td>	
					<radio :v-value="0" v-model="reverseProxyConfig.requestHostType">跟随CDN域名</radio> &nbsp;
					<radio :v-value="1" v-model="reverseProxyConfig.requestHostType">跟随源站</radio> &nbsp;
					<radio :v-value="2" v-model="reverseProxyConfig.requestHostType">自定义</radio>
					<div v-show="reverseProxyConfig.requestHostType == 2" style="margin-top: 0.8em">
						<input type="text" placeholder="比如example.com" v-model="reverseProxyConfig.requestHost"/>
					</div>
					<p class="comment">请求源站时的Host，用于修改源站接收到的域名
					<span v-if="reverseProxyConfig.requestHostType == 0">，"跟随CDN域名"是指源站接收到的域名和当前CDN访问域名保持一致</span>
					<span v-if="reverseProxyConfig.requestHostType == 1">，"跟随源站"是指源站接收到的域名仍然是填写的源站地址中的信息，不随代理服务域名改变而改变</span>					
					<span v-if="reverseProxyConfig.requestHostType == 2">，自定义Host内容中支持请求变量</span>。</p>
				</td>
			</tr>
			<tr v-show="family == null || family == 'http'">
				<td>回源主机名移除端口</td>
				<td><checkbox v-model="reverseProxyConfig.requestHostExcludingPort"></checkbox>
					<p class="comment">选中后表示移除回源主机名中的端口部分。</p>
				</td>
			</tr>
		</tbody>
		<more-options-tbody @change="changeAdvancedVisible" v-if="isOn()"></more-options-tbody>
		<tbody v-show="isOn() && advancedVisible">
			<tr v-show="family == null || family == 'http'">
				<td>回源跟随</td>
				<td>
					<checkbox v-model="reverseProxyConfig.followRedirects"></checkbox>
					<p class="comment">选中后，自动读取源站跳转后的网页内容。</p>
				</td>
			</tr>
			<tr v-show="family == null || family == 'http'">
		        <td>自动添加的报头</td>
		        <td>
		            <div>
		                <div style="width: 14em; float: left; margin-bottom: 1em" v-for="header in forwardHeaders" :key="header.name">
		                    <checkbox v-model="header.isChecked" @input="changeAddHeader">{{header.name}}</checkbox>
                        </div>
                        <div style="clear: both;"></div>
                    </div>
                    <p class="comment">选中后，会自动向源站请求添加这些报头。</p>
                </td> 
            </tr>
			<tr v-show="family == null || family == 'http'">
				<td>请求URI<em>（RequestURI）</em></td>
				<td>
					<input type="text" placeholder="\${requestURI}" v-model="reverseProxyConfig.requestURI"/>
					<p class="comment">\${requestURI}为完整的请求URI，可以使用类似于"\${requestURI}?arg1=value1&arg2=value2"的形式添加你的参数。</p>
				</td>
			</tr>
			<tr v-show="family == null || family == 'http'">
				<td>去除URL前缀<em>（StripPrefix）</em></td>
				<td>
					<input type="text" v-model="reverseProxyConfig.stripPrefix" placeholder="/PREFIX"/>
					<p class="comment">可以把请求的路径部分前缀去除后再查找文件，比如把 <span class="ui label tiny">/web/app/index.html</span> 去除前缀 <span class="ui label tiny">/web</span> 后就变成 <span class="ui label tiny">/app/index.html</span>。 </p>
				</td>
			</tr>
			<tr v-show="family == null || family == 'http'">
				<td>自动刷新缓存区<em>（AutoFlush）</em></td>
				<td>
					<div class="ui checkbox">
						<input type="checkbox" v-model="reverseProxyConfig.autoFlush"/>
						<label></label>
					</div>
					<p class="comment">开启后将自动刷新缓冲区数据到客户端，在类似于SSE（server-sent events）等场景下很有用。</p>
				</td>
			</tr>
			<tr v-show="family == null || family == 'http'">
            	<td>自动重试50X</td>
            	<td>
            		<checkbox v-model="reverseProxyConfig.retry50X"></checkbox>
            		<p class="comment">选中后，表示当源站返回状态码为50X（比如502、504等）时，自动重试其他源站。</p>
				</td>
			</tr>
			<tr v-show="family == null || family == 'http'">
            	<td>自动重试40X</td>
            	<td>
            		<checkbox v-model="reverseProxyConfig.retry40X"></checkbox>
            		<p class="comment">选中后，表示当源站返回状态码为40X（403或404）时，自动重试其他源站。</p>
				</td>
			</tr>
			<tr v-show="family != 'unix'">
            	<td>PROXY Protocol</td>
            	<td>
            		<checkbox name="proxyProtocolIsOn" v-model="reverseProxyConfig.proxyProtocol.isOn"></checkbox>
            		<p class="comment">选中后表示启用PROXY Protocol，每次连接源站时都会在头部写入客户端地址信息。</p>
				</td>
			</tr>
			<tr v-show="family != 'unix' && reverseProxyConfig.proxyProtocol.isOn">
				<td>PROXY Protocol版本</td>
				<td>
					<select class="ui dropdown auto-width" name="proxyProtocolVersion" v-model="reverseProxyConfig.proxyProtocol.version">
						<option value="1">1</option>
						<option value="2">2</option>
					</select>
					<p class="comment" v-if="reverseProxyConfig.proxyProtocol.version == 1">发送类似于<code-label>PROXY TCP4 192.168.1.1 192.168.1.10 32567 443</code-label>的头部信息。</p>
					<p class="comment" v-if="reverseProxyConfig.proxyProtocol.version == 2">发送二进制格式的头部信息。</p>
				</td>
			</tr>
		</tbody>
	</table>
	<div class="margin"></div>
</div>`
})

Vue.component("http-oss-bucket-params", {
	props: ["v-oss-config", "v-params", "name"],
	data: function () {
		let params = this.vParams
		if (params == null) {
			params = []
		}

		let ossConfig = this.vOssConfig
		if (ossConfig == null) {
			ossConfig = {
				bucketParam: "input",
				bucketName: "",
				bucketArgName: ""
			}
		} else {
			// 兼容以往
			if (ossConfig.bucketParam != null && ossConfig.bucketParam.length == 0) {
				ossConfig.bucketParam = "input"
			}
			if (ossConfig.options != null && ossConfig.options.bucketName != null && ossConfig.options.bucketName.length > 0) {
				ossConfig.bucketName = ossConfig.options.bucketName
			}
		}

		return {
			params: params,
			ossConfig: ossConfig
		}
	},
	template: `<tbody>
	<tr>
		<td>{{name}}名称获取方式 *</td>
		<td>
			<select class="ui dropdown auto-width" name="bucketParam" v-model="ossConfig.bucketParam">
				<option v-for="param in params" :value="param.code" v-if="param.example.length == 0">{{param.name.replace("\${optionName}", name)}}</option>
				<option v-for="param in params" :value="param.code" v-if="param.example.length > 0">{{param.name}} - {{param.example}}</option>
			</select>
			<p class="comment" v-for="param in params" v-if="param.code == ossConfig.bucketParam">{{param.description.replace("\${optionName}", name)}}</p>
		</td>
	</tr>
    <tr v-if="ossConfig.bucketParam == 'input'">
        <td>{{name}}名称 *</td>
        <td>
            <input type="text" name="bucketName" maxlength="100" v-model="ossConfig.bucketName"/>
            <p class="comment">{{name}}名称，类似于<code-label>bucket-12345678</code-label>。</p>
        </td>
    </tr>
    <tr v-if="ossConfig.bucketParam == 'arg'">
    	<td>{{name}}参数名称 *</td>
        <td>
            <input type="text" name="bucketArgName" maxlength="100" v-model="ossConfig.bucketArgName"/>
            <p class="comment">{{name}}参数名称，比如<code-label>?myBucketName=BUCKET-NAME</code-label>中的<code-label>myBucketName</code-label>。</p>
        </td>
	</tr>
</tbody>`
})

Vue.component("http-referers-config-box", {
	props: ["v-referers-config", "v-is-location", "v-is-group"],
	data: function () {
		let config = this.vReferersConfig
		if (config == null) {
			config = {
				isPrior: false,
				isOn: false,
				allowEmpty: true,
				allowSameDomain: true,
				allowDomains: [],
				denyDomains: [],
				checkOrigin: true
			}
		}
		if (config.allowDomains == null) {
			config.allowDomains = []
		}
		if (config.denyDomains == null) {
			config.denyDomains = []
		}
		return {
			config: config,
			moreOptionsVisible: false
		}
	},
	methods: {
		isOn: function () {
			return ((!this.vIsLocation && !this.vIsGroup) || this.config.isPrior) && this.config.isOn
		},
		changeAllowDomains: function (domains) {
			if (typeof (domains) == "object") {
				this.config.allowDomains = domains
				this.$forceUpdate()
			}
		},
		changeDenyDomains: function (domains) {
			if (typeof (domains) == "object") {
				this.config.denyDomains = domains
				this.$forceUpdate()
			}
		},
		showMoreOptions: function () {
			this.moreOptionsVisible = !this.moreOptionsVisible
		}
	},
	template: `<div>
<input type="hidden" name="referersJSON" :value="JSON.stringify(config)"/>
<table class="ui table selectable definition">
	<prior-checkbox :v-config="config" v-if="vIsLocation || vIsGroup"></prior-checkbox>
	<tbody v-show="(!vIsLocation && !vIsGroup) || config.isPrior">
		<tr>
			<td class="title">启用防盗链</td>
			<td>
				<div class="ui checkbox">
					<input type="checkbox" value="1" v-model="config.isOn"/>
					<label></label>
				</div>
				<p class="comment">选中后表示开启防盗链。</p>
			</td>
		</tr>
	</tbody>
	<tbody v-show="isOn()">
		<tr>
			<td class="title">允许直接访问网站</td>
			<td>
				<checkbox v-model="config.allowEmpty"></checkbox>
				<p class="comment">允许用户直接访问网站，用户第一次访问网站时来源域名通常为空。</p>
			</td>
		</tr>
		<tr>
			<td>来源域名允许一致</td>
			<td>
				<checkbox v-model="config.allowSameDomain"></checkbox>
				<p class="comment">允许来源域名和当前访问的域名一致，相当于在站内访问。</p>
			</td>
		</tr>
		<tr>
			<td>允许的来源域名</td>
			<td>
				<domains-box :v-domains="config.allowDomains" @change="changeAllowDomains">></domains-box>
				<p class="comment">允许的其他来源域名列表，比如<code-label>example.com</code-label>、<code-label>*.example.com</code-label>。单个星号<code-label>*</code-label>表示允许所有域名。</p>
			</td>
		</tr>
		<tr>
			<td>禁止的来源域名</td>
			<td>
				<domains-box :v-domains="config.denyDomains" @change="changeDenyDomains"></domains-box>
				<p class="comment">禁止的来源域名列表，比如<code-label>example.org</code-label>、<code-label>*.example.org</code-label>；除了这些禁止的来源域名外，其他域名都会被允许，除非限定了允许的来源域名。</p>
			</td>
		</tr>
		<tr>
			<td colspan="2"><more-options-indicator @change="showMoreOptions"></more-options-indicator></td>
		</tr>
	</tbody>
	<tbody v-show="moreOptionsVisible && isOn()">
		<tr>
			<td>同时检查Origin</td>
			<td>
				<checkbox v-model="config.checkOrigin"></checkbox>
				<p class="comment">如果请求没有指定Referer Header，则尝试检查Origin Header，多用于跨站调用。</p>
			</td>
		</tr>
		<tr>
			<td>例外URL</td>
			<td>
				<url-patterns-box v-model="config.exceptURLPatterns"></url-patterns-box>
				<p class="comment">如果填写了例外URL，表示这些URL不做处理。</p>
			</td>
		</tr>
		<tr>
			<td>限制URL</td>
			<td>
				<url-patterns-box v-model="config.onlyURLPatterns"></url-patterns-box>
				<p class="comment">如果填写了限制URL，表示只对这些URL进行处理；如果不填则表示支持所有的URL。</p>
			</td>
		</tr>
	</tbody>
</table>
<div class="ui margin"></div>
</div>`
})

Vue.component("http-charsets-box", {
	props: ["v-usual-charsets", "v-all-charsets", "v-charset-config", "v-is-location", "v-is-group"],
	data: function () {
		let charsetConfig = this.vCharsetConfig
		if (charsetConfig == null) {
			charsetConfig = {
				isPrior: false,
				isOn: false,
				charset: "",
				isUpper: false,
				force: false
			}
		}
		return {
			charsetConfig: charsetConfig,
			advancedVisible: false
		}
	},
	methods: {
		changeAdvancedVisible: function (v) {
			this.advancedVisible = v
		}
	},
	template: `<div>
	<input type="hidden" name="charsetJSON" :value="JSON.stringify(charsetConfig)"/>
	<table class="ui table definition selectable">
		<prior-checkbox :v-config="charsetConfig" v-if="vIsLocation || vIsGroup"></prior-checkbox>
		<tbody v-show="(!vIsLocation && !vIsGroup) || charsetConfig.isPrior">
			<tr>
				<td class="title">启用字符编码</td>
				<td>
					<div class="ui checkbox">
						<input type="checkbox" v-model="charsetConfig.isOn"/>
						<label></label>
					</div>
				</td>
			</tr>
		</tbody>
		<tbody v-show="((!vIsLocation && !vIsGroup) || charsetConfig.isPrior) && charsetConfig.isOn">	
			<tr>
				<td class="title">选择字符编码</td>
				<td><select class="ui dropdown" style="width:20em" name="charset" v-model="charsetConfig.charset">
						<option value="">[未选择]</option>
						<optgroup label="常用字符编码"></optgroup>
						<option v-for="charset in vUsualCharsets" :value="charset.charset">{{charset.charset}}（{{charset.name}}）</option>
						<optgroup label="全部字符编码"></optgroup>
						<option v-for="charset in vAllCharsets" :value="charset.charset">{{charset.charset}}（{{charset.name}}）</option>
					</select>
				</td>
			</tr>
		</tbody>
		<more-options-tbody @change="changeAdvancedVisible" v-if="((!vIsLocation && !vIsGroup) || charsetConfig.isPrior) && charsetConfig.isOn"></more-options-tbody>
		<tbody v-show="((!vIsLocation && !vIsGroup) || charsetConfig.isPrior) && charsetConfig.isOn && advancedVisible">
			<tr>
				<td>强制替换</td>
				<td>
					<checkbox v-model="charsetConfig.force"></checkbox>
					<p class="comment">选中后，表示强制覆盖已经设置的字符集；不选中，表示如果源站已经设置了字符集，则保留不修改。</p>
				</td>
			</tr>
			<tr>
				<td>字符编码大写</td>
				<td>
					<div class="ui checkbox">
						<input type="checkbox" v-model="charsetConfig.isUpper"/>
						<label></label>
					</div>
					<p class="comment">选中后将指定的字符编码转换为大写，比如默认为<code-label>utf-8</code-label>，选中后将改为<code-label>UTF-8</code-label>。</p>
				</td>
			</tr>
		</tbody>
	</table>
	<div class="margin"></div>
</div>`
})

// 压缩配置
Vue.component("http-compression-config-box", {
	props: ["v-compression-config", "v-is-location", "v-is-group"],
	mounted: function () {
		let that = this
		sortLoad(function () {
			that.initSortableTypes()
		})
	},
	data: function () {
		let config = this.vCompressionConfig
		if (config == null) {
			config = {
				isPrior: false,
				isOn: false,
				useDefaultTypes: true,
				types: ["brotli", "gzip", "zstd", "deflate"],
				level: 0,
				decompressData: false,
				gzipRef: null,
				deflateRef: null,
				brotliRef: null,
				minLength: {count: 1, "unit": "kb"},
				maxLength: {count: 32, "unit": "mb"},
				mimeTypes: ["text/*", "application/javascript", "application/json", "application/atom+xml", "application/rss+xml", "application/xhtml+xml", "font/*", "image/svg+xml"],
				extensions: [".js", ".json", ".html", ".htm", ".xml", ".css", ".woff2", ".txt"],
				exceptExtensions: [".apk", ".ipa"],
				conds: null,
				enablePartialContent: false,
				onlyURLPatterns: [],
				exceptURLPatterns: []
			}
		}

		if (config.types == null) {
			config.types = []
		}
		if (config.mimeTypes == null) {
			config.mimeTypes = []
		}
		if (config.extensions == null) {
			config.extensions = []
		}

		let allTypes = [
			{
				name: "Gzip",
				code: "gzip",
				isOn: true
			},
			{
				name: "Deflate",
				code: "deflate",
				isOn: true
			},
			{
				name: "Brotli",
				code: "brotli",
				isOn: true
			},
			{
				name: "ZSTD",
				code: "zstd",
				isOn: true
			}
		]

		let configTypes = []
		config.types.forEach(function (typeCode) {
			allTypes.forEach(function (t) {
				if (typeCode == t.code) {
					t.isOn = true
					configTypes.push(t)
				}
			})
		})
		allTypes.forEach(function (t) {
			if (!config.types.$contains(t.code)) {
				t.isOn = false
				configTypes.push(t)
			}
		})

		return {
			config: config,
			moreOptionsVisible: false,
			allTypes: configTypes
		}
	},
	methods: {
		isOn: function () {
			return ((!this.vIsLocation && !this.vIsGroup) || this.config.isPrior) && this.config.isOn
		},
		changeExtensions: function (values) {
			values.forEach(function (v, k) {
				if (v.length > 0 && v[0] != ".") {
					values[k] = "." + v
				}
			})
			this.config.extensions = values
		},
		changeExceptExtensions: function (values) {
			values.forEach(function (v, k) {
				if (v.length > 0 && v[0] != ".") {
					values[k] = "." + v
				}
			})
			this.config.exceptExtensions = values
		},
		changeMimeTypes: function (values) {
			this.config.mimeTypes = values
		},
		changeAdvancedVisible: function () {
			this.moreOptionsVisible = !this.moreOptionsVisible
		},
		changeConds: function (conds) {
			this.config.conds = conds
		},
		changeType: function () {
			this.config.types = []
			let that = this
			this.allTypes.forEach(function (v) {
				if (v.isOn) {
					that.config.types.push(v.code)
				}
			})
		},
		initSortableTypes: function () {
			let box = document.querySelector("#compression-types-box")
			let that = this
			Sortable.create(box, {
				draggable: ".checkbox",
				handle: ".icon.handle",
				onStart: function () {

				},
				onUpdate: function (event) {
					let checkboxes = box.querySelectorAll(".checkbox")
					let codes = []
					checkboxes.forEach(function (checkbox) {
						let code = checkbox.getAttribute("data-code")
						codes.push(code)
					})
					that.config.types = codes
				}
			})
		}
	},
	template: `<div>
	<input type="hidden" name="compressionJSON" :value="JSON.stringify(config)"/>
	<table class="ui table definition selectable">
		<prior-checkbox :v-config="config" v-if="vIsLocation || vIsGroup"></prior-checkbox>
		<tbody v-show="(!vIsLocation && !vIsGroup) || config.isPrior">
			<tr>
				<td class="title">启用内容压缩</td>
				<td>
					<div class="ui checkbox">
						<input type="checkbox" value="1" v-model="config.isOn"/>
						<label></label>
					</div>
				</td>
			</tr>
		</tbody>
		<tbody v-show="isOn()">
			<tr>
				<td>支持的扩展名</td>
				<td>
					<values-box :values="config.extensions" @change="changeExtensions" placeholder="比如 .html"></values-box>
					<p class="comment">含有这些扩展名的URL将会被压缩，不区分大小写。</p>
				</td>
			</tr>
			<tr>
				<td>例外扩展名</td>
				<td>
					<values-box :values="config.exceptExtensions" @change="changeExceptExtensions" placeholder="比如 .html"></values-box>
					<p class="comment">含有这些扩展名的URL将<strong>不会</strong>被压缩，不区分大小写。</p>
				</td>
			</tr>
			<tr>
				<td>支持的MimeType</td>
				<td>
					<values-box :values="config.mimeTypes" @change="changeMimeTypes" placeholder="比如 text/*"></values-box>
					<p class="comment">响应的Content-Type里包含这些MimeType的内容将会被压缩。</p>
				</td>
			</tr>
		</tbody>
		<more-options-tbody @change="changeAdvancedVisible" v-if="isOn()"></more-options-tbody>
		<tbody v-show="isOn() && moreOptionsVisible">
			<tr>
				<td>压缩算法</td>
				<td>
					<div class="ui checkbox">
						<input type="checkbox" v-model="config.useDefaultTypes" id="compression-use-default"/>
						<label v-if="config.useDefaultTypes" for="compression-use-default">使用默认顺序<span class="grey small">（brotli、gzip、 zstd、deflate）</span></label>
						<label v-if="!config.useDefaultTypes" for="compression-use-default">使用默认顺序</label>
					</div>
					<div v-show="!config.useDefaultTypes">
						<div class="ui divider"></div>
						<div id="compression-types-box">
							<div class="ui checkbox" v-for="t in allTypes" style="margin-right: 2em" :data-code="t.code">
								<input type="checkbox" v-model="t.isOn" :id="'compression-type-' + t.code" @change="changeType"/>
								<label :for="'compression-type-' + t.code">{{t.name}} &nbsp; <i class="icon list small grey handle"></i></label>
							</div>
						</div>
					</div>
					
					<p class="comment" v-show="!config.useDefaultTypes">选择支持的压缩算法和优先顺序，拖动<i class="icon list small grey"></i>图表排序。</p>
				</td>
			</tr>
			<tr>
				<td>支持已压缩内容</td>
				<td>
					<checkbox v-model="config.decompressData"></checkbox>
					<p class="comment">支持对已压缩内容尝试重新使用新的算法压缩；不选中表示保留当前的压缩格式。</p>
				</td>
			</tr>
			<tr>
				<td>内容最小长度</td>
				<td>
					<size-capacity-box :v-name="'minLength'" :v-value="config.minLength" :v-unit="'kb'"></size-capacity-box>
					<p class="comment">0表示不限制，内容长度从文件尺寸或Content-Length中获取。</p>
				</td>
			</tr>
			<tr>
				<td>内容最大长度</td>
				<td>
					<size-capacity-box :v-name="'maxLength'" :v-value="config.maxLength" :v-unit="'mb'"></size-capacity-box>
					<p class="comment">0表示不限制，内容长度从文件尺寸或Content-Length中获取。</p>
				</td>
			</tr>
			<tr>
				<td>支持Partial<br/>Content</td>
				<td>
					<checkbox v-model="config.enablePartialContent"></checkbox>
					<p class="comment">支持对分片内容（PartialContent）的压缩；除非客户端有特殊要求，一般不需要启用。</p>
				</td>
			</tr>
				<tr>
				<td>例外URL</td>
				<td>
					<url-patterns-box v-model="config.exceptURLPatterns"></url-patterns-box>
					<p class="comment">如果填写了例外URL，表示这些URL跳过不做处理。</p>
				</td>
			</tr>
			<tr>
				<td>限制URL</td>
				<td>
					<url-patterns-box v-model="config.onlyURLPatterns"></url-patterns-box>
					<p class="comment">如果填写了限制URL，表示只对这些URL进行压缩处理；如果不填则表示支持所有的URL。</p>
				</td>
			</tr>
			<tr>
				<td>匹配条件</td>
				<td>
					<http-request-conds-box :v-conds="config.conds" @change="changeConds"></http-request-conds-box>
				</td>
			</tr>
		</tbody>
	</table>
	<div class="margin"></div>
</div>`
})

Vue.component("http-cache-refs-config-box", {
	props: ["v-cache-refs", "v-cache-config", "v-cache-policy-id", "v-web-id", "v-max-bytes"],
	mounted: function () {
		let that = this
		sortTable(function (ids) {
			let newRefs = []
			ids.forEach(function (id) {
				that.refs.forEach(function (ref) {
					if (ref.id == id) {
						newRefs.push(ref)
					}
				})
			})
			that.updateRefs(newRefs)
			that.change()
		})
	},
	data: function () {
		let refs = this.vCacheRefs
		if (refs == null) {
			refs = []
		}

		let maxBytes = this.vMaxBytes

		let id = 0
		refs.forEach(function (ref) {
			id++
			ref.id = id

			// check max size
			if (ref.maxSize != null && maxBytes != null && maxBytes.count > 0 && teaweb.compareSizeCapacity(ref.maxSize, maxBytes) > 0) {
				ref.overMaxSize = maxBytes
			}
		})
		return {
			refs: refs,
			id: id // 用来对条件进行排序
		}
	},
	methods: {
		addRef: function (isReverse) {
			window.UPDATING_CACHE_REF = null

			let height = window.innerHeight
			if (height > 500) {
				height = 500
			}
			let that = this
			teaweb.popup("/servers/server/settings/cache/createPopup?isReverse=" + (isReverse ? 1 : 0), {
				height: height + "px",
				callback: function (resp) {
					let newRef = resp.data.cacheRef
					if (newRef.conds == null) {
						return
					}

					that.id++
					newRef.id = that.id

					if (newRef.isReverse) {
						let newRefs = []
						let isAdded = false
						that.refs.forEach(function (v) {
							if (!v.isReverse && !isAdded) {
								newRefs.push(newRef)
								isAdded = true
							}
							newRefs.push(v)
						})
						if (!isAdded) {
							newRefs.push(newRef)
						}

						that.updateRefs(newRefs)
					} else {
						that.refs.push(newRef)
					}

					// move to bottom
					var afterChangeCallback = function () {
						setTimeout(function () {
							let rightBox = document.querySelector(".right-box")
							if (rightBox != null) {
								rightBox.scrollTo(0, isReverse ? 0 : 100000)
							}
						}, 100)
					}

					that.change(afterChangeCallback)
				}
			})
		},
		updateRef: function (index, cacheRef) {
			window.UPDATING_CACHE_REF = teaweb.clone(cacheRef)

			let height = window.innerHeight
			if (height > 500) {
				height = 500
			}
			let that = this
			teaweb.popup("/servers/server/settings/cache/createPopup", {
				height: height + "px",
				callback: function (resp) {
					resp.data.cacheRef.id = that.refs[index].id
					Vue.set(that.refs, index, resp.data.cacheRef)
					that.change()
					that.$refs.cacheRef[index].updateConds(resp.data.cacheRef.conds, resp.data.cacheRef.simpleCond)
					that.$refs.cacheRef[index].notifyChange()
				}
			})
		},
		disableRef: function (ref) {
			ref.isOn = false
			this.change()
		},
		enableRef: function (ref) {
			ref.isOn = true
			this.change()
		},
		removeRef: function (index) {
			let that = this
			teaweb.confirm("确定要删除此缓存设置吗？", function () {
				that.refs.$remove(index)
				that.change()
			})
		},
		updateRefs: function (newRefs) {
			this.refs = newRefs
			if (this.vCacheConfig != null) {
				this.vCacheConfig.cacheRefs = newRefs
			}
		},
		timeUnitName: function (unit) {
			switch (unit) {
				case "ms":
					return "毫秒"
				case "second":
					return "秒"
				case "minute":
					return "分钟"
				case "hour":
					return "小时"
				case "day":
					return "天"
				case "week":
					return "周 "
			}
			return unit
		},
		change: function (callback) {
			this.$forceUpdate()

			// 自动保存
			if (this.vCachePolicyId != null && this.vCachePolicyId > 0) { // 缓存策略
				Tea.action("/servers/components/cache/updateRefs")
					.params({
						cachePolicyId: this.vCachePolicyId,
						refsJSON: JSON.stringify(this.refs)
					})
					.post()
			} else if (this.vWebId != null && this.vWebId > 0) { // Server Web or Group Web
				Tea.action("/servers/server/settings/cache/updateRefs")
					.params({
						webId: this.vWebId,
						refsJSON: JSON.stringify(this.refs)
					})
					.success(function (resp) {
						if (resp.data.isUpdated) {
							teaweb.successToast("保存成功", null, function () {
								if (typeof callback == "function") {
									callback()
								}
							})
						}
					})
					.post()
			}
		},
		search: function (keyword) {
			if (typeof keyword != "string") {
				keyword = ""
			}

			this.refs.forEach(function (ref) {
				if (keyword.length == 0) {
					ref.visible = true
					return
				}
				ref.visible = false

				// simple cond
				if (ref.simpleCond != null && typeof ref.simpleCond.value == "string" && teaweb.match(ref.simpleCond.value, keyword)) {
					ref.visible = true
					return
				}

				// composed conds
				if (ref.conds == null || ref.conds.groups == null || ref.conds.groups.length == 0) {
					return
				}

				ref.conds.groups.forEach(function (group) {
					if (group.conds != null) {
						group.conds.forEach(function (cond) {
							if (typeof cond.value == "string" && teaweb.match(cond.value, keyword)) {
								ref.visible = true
							}
						})
					}
				})
			})
			this.$forceUpdate()
		}
	},
	template: `<div>
	<input type="hidden" name="refsJSON" :value="JSON.stringify(refs)"/>
	
	<div>
		<p class="comment" v-if="refs.length == 0">暂时还没有缓存条件。</p>
		<table class="ui table selectable celled" v-show="refs.length > 0" id="sortable-table">
			<thead>
				<tr>
					<th style="width:1em"></th>
					<th>缓存条件</th>
					<th style="width: 7em">缓存时间</th>
					<th class="three op">操作</th>
				</tr>
			</thead>	
			<tbody v-for="(cacheRef, index) in refs" :key="cacheRef.id" :v-id="cacheRef.id" v-show="cacheRef.visible !== false">
				<tr>
					<td style="text-align: center;"><i class="icon bars handle grey"></i> </td>
					<td :class="{'color-border': cacheRef.conds != null && cacheRef.conds.connector == 'and', disabled: !cacheRef.isOn}" :style="{'border-left':cacheRef.isReverse ? '1px #db2828 solid' : ''}">
						<http-request-conds-view :v-conds="cacheRef.conds" ref="cacheRef" :class="{disabled: !cacheRef.isOn}" v-if="cacheRef.conds != null && cacheRef.conds.groups != null"></http-request-conds-view>
						<http-request-cond-view :v-cond="cacheRef.simpleCond" ref="cacheRef" v-if="cacheRef.simpleCond != null"></http-request-cond-view>
						
						<!-- 特殊参数 -->
						<grey-label v-if="cacheRef.key != null && cacheRef.key.indexOf('\${args}') < 0">忽略URI参数</grey-label>
						
						<grey-label v-if="cacheRef.minSize != null && cacheRef.minSize.count > 0">
							{{cacheRef.minSize.count}}{{cacheRef.minSize.unit}}
							<span v-if="cacheRef.maxSize != null && cacheRef.maxSize.count > 0">- {{cacheRef.maxSize.count}}{{cacheRef.maxSize.unit.toUpperCase()}}</span>
						</grey-label>
						<grey-label v-else-if="cacheRef.maxSize != null && cacheRef.maxSize.count > 0">0 - {{cacheRef.maxSize.count}}{{cacheRef.maxSize.unit.toUpperCase()}}</grey-label>
						
						<grey-label v-if="cacheRef.overMaxSize != null"><span class="red">系统限制{{cacheRef.overMaxSize.count}}{{cacheRef.overMaxSize.unit.toUpperCase()}}</span> </grey-label>
						
						<grey-label v-if="cacheRef.methods != null && cacheRef.methods.length > 0">{{cacheRef.methods.join(", ")}}</grey-label>
						<grey-label v-if="cacheRef.expiresTime != null && cacheRef.expiresTime.isPrior && cacheRef.expiresTime.isOn">Expires</grey-label>
						<grey-label v-if="cacheRef.status != null && cacheRef.status.length > 0 && (cacheRef.status.length > 1 || cacheRef.status[0] != 200)">状态码：{{cacheRef.status.map(function(v) {return v.toString()}).join(", ")}}</grey-label>
						<grey-label v-if="cacheRef.allowPartialContent">分片缓存</grey-label>
						<grey-label v-if="cacheRef.alwaysForwardRangeRequest">Range回源</grey-label>
						<grey-label v-if="cacheRef.enableIfNoneMatch">If-None-Match</grey-label>
						<grey-label v-if="cacheRef.enableIfModifiedSince">If-Modified-Since</grey-label>
						<grey-label v-if="cacheRef.enableReadingOriginAsync">支持异步</grey-label>
					</td>
					<td :class="{disabled: !cacheRef.isOn}">
						<span v-if="!cacheRef.isReverse">{{cacheRef.life.count}} {{timeUnitName(cacheRef.life.unit)}}</span>
						<span v-else class="red">不缓存</span>
					</td>
					<td>
						<a href="" @click.prevent="updateRef(index, cacheRef)">修改</a> &nbsp;
						<a href="" v-if="cacheRef.isOn" @click.prevent="disableRef(cacheRef)">暂停</a><a href="" v-if="!cacheRef.isOn" @click.prevent="enableRef(cacheRef)"><span class="red">恢复</span></a> &nbsp;
						<a href="" @click.prevent="removeRef(index)">删除</a>
					</td>
				</tr>
			</tbody>
		</table>
		<p class="comment" v-if="refs.length > 1">所有条件匹配顺序为从上到下，可以拖动左侧的<i class="icon bars"></i>排序。网站设置的优先级比全局缓存策略设置的优先级要高。</p>
		
		<button class="ui button tiny" @click.prevent="addRef(false)" type="button">+添加缓存条件</button> &nbsp; &nbsp; <a href="" @click.prevent="addRef(true)" style="font-size: 0.8em">+添加不缓存条件</a>
	</div>
	<div class="margin"></div>
</div>`
})

// 通用Header长度
let defaultGeneralHeaders = ["Cache-Control", "Connection", "Date", "Pragma", "Trailer", "Transfer-Encoding", "Upgrade", "Via", "Warning"]
Vue.component("http-cond-general-header-length", {
	props: ["v-checkpoint"],
	data: function () {
		let headers = null
		let length = null

		if (window.parent.UPDATING_RULE != null) {
			let options = window.parent.UPDATING_RULE.checkpointOptions
			if (options.headers != null && Array.$isArray(options.headers)) {
				headers = options.headers
			}
			if (options.length != null) {
				length = options.length
			}
		}


		if (headers == null) {
			headers = defaultGeneralHeaders
		}

		if (length == null) {
			length = 128
		}

		let that = this
		setTimeout(function () {
			that.change()
		}, 100)

		return {
			headers: headers,
			length: length
		}
	},
	watch: {
		length: function (v) {
			let len = parseInt(v)
			if (isNaN(len)) {
				len = 0
			}
			if (len < 0) {
				len = 0
			}
			this.length = len
			this.change()
		}
	},
	methods: {
		change: function () {
			this.vCheckpoint.options = [
				{
					code: "headers",
					value: this.headers
				},
				{
					code: "length",
					value: this.length
				}
			]
		}
	},
	template: `<div>
	<table class="ui table">
		<tr>
			<td class="title">通用Header列表</td>
			<td>
				<values-box :values="headers" :placeholder="'Header'" @change="change"></values-box>
				<p class="comment">需要检查的Header列表。</p>
			</td>
		</tr>
		<tr>
			<td>Header值超出长度</td>
			<td>
				<div class="ui input right labeled">
					<input type="text" name="" style="width: 5em" v-model="length" maxlength="6"/>
					<span class="ui label">字节</span>
				</div>
				<p class="comment">超出此长度认为匹配成功，0表示不限制。</p>
			</td>
		</tr>
	</table>
</div>`
})

// CC
Vue.component("http-firewall-checkpoint-cc", {
	props: ["v-checkpoint"],
	data: function () {
		let keys = []
		let period = 60
		let threshold = 1000
		let ignoreCommonFiles = true
		let enableFingerprint = true

		let options = {}
		if (window.parent.UPDATING_RULE != null) {
			options = window.parent.UPDATING_RULE.checkpointOptions
		}

		if (options == null) {
			options = {}
		}
		if (options.keys != null) {
			keys = options.keys
		}
		if (keys.length == 0) {
			keys = ["${remoteAddr}", "${requestPath}"]
		}
		if (options.period != null) {
			period = options.period
		}
		if (options.threshold != null) {
			threshold = options.threshold
		}
		if (options.ignoreCommonFiles != null && typeof (options.ignoreCommonFiles) == "boolean") {
			ignoreCommonFiles = options.ignoreCommonFiles
		}
		if (options.enableFingerprint != null && typeof (options.enableFingerprint) == "boolean") {
			enableFingerprint = options.enableFingerprint
		}

		let that = this
		setTimeout(function () {
			that.change()
		}, 100)

		return {
			keys: keys,
			period: period,
			threshold: threshold,
			ignoreCommonFiles: ignoreCommonFiles,
			enableFingerprint: enableFingerprint,
			options: {},
			value: threshold
		}
	},
	watch: {
		period: function () {
			this.change()
		},
		threshold: function () {
			this.change()
		},
		ignoreCommonFiles: function () {
			this.change()
		},
		enableFingerprint: function () {
			this.change()
		}
	},
	methods: {
		changeKeys: function (keys) {
			this.keys = keys
			this.change()
		},
		change: function () {
			let period = parseInt(this.period.toString())
			if (isNaN(period) || period <= 0) {
				period = 60
			}

			let threshold = parseInt(this.threshold.toString())
			if (isNaN(threshold) || threshold <= 0) {
				threshold = 1000
			}
			this.value = threshold

			let ignoreCommonFiles = this.ignoreCommonFiles
			if (typeof ignoreCommonFiles != "boolean") {
				ignoreCommonFiles = false
			}

			let enableFingerprint = this.enableFingerprint
			if (typeof enableFingerprint != "boolean") {
				enableFingerprint = true
			}

			this.vCheckpoint.options = [
				{
					code: "keys",
					value: this.keys
				},
				{
					code: "period",
					value: period,
				},
				{
					code: "threshold",
					value: threshold
				},
				{
					code: "ignoreCommonFiles",
					value: ignoreCommonFiles
				},
				{
					code: "enableFingerprint",
					value: enableFingerprint
				}
			]
		},
		thresholdTooLow: function () {
			let threshold = parseInt(this.threshold.toString())
			if (isNaN(threshold) || threshold <= 0) {
				threshold = 1000
			}
			return threshold > 0 && threshold < 5
		}
	},
	template: `<div>
	<input type="hidden" name="operator" value="gt"/>
	<input type="hidden" name="value" :value="value"/>
	<table class="ui table">
		<tr>
			<td class="title">统计对象组合 *</td>
			<td>
				<metric-keys-config-box :v-keys="keys" @change="changeKeys"></metric-keys-config-box>
			</td>
		</tr>
		<tr>
			<td>统计周期 *</td>
			<td>
				<div class="ui input right labeled">
					<input type="text" v-model="period" style="width: 6em" maxlength="8"/>
					<span class="ui label">秒</span>
				</div>
			</td>
		</tr>
		<tr>
			<td>阈值 *</td>
			<td>
				<input type="text" v-model="threshold" style="width: 6em" maxlength="8"/>
				<p class="comment" v-if="thresholdTooLow()"><span class="red">对于网站类应用来说，当前阈值设置的太低，有可能会影响用户正常访问。</span></p>
			</td>
		</tr>
		<tr>
			<td>检查请求来源指纹</td>
			<td>
				<checkbox v-model="enableFingerprint"></checkbox>
				<p class="comment">在接收到HTTPS请求时尝试检查请求来源的指纹，用来检测代理服务和爬虫攻击；如果你在网站前面放置了别的反向代理服务，请取消此选项。</p>
			</td>
		</tr>
		<tr>
			<td>忽略常用文件</td>
			<td>
				<checkbox v-model="ignoreCommonFiles"></checkbox>
				<p class="comment">忽略js、css、jpg等常在网页里被引用的文件名，即对这些文件的访问不加入计数，可以减少误判几率。</p>
			</td>
		</tr>
	</table>
</div>`
})

// 防盗链
Vue.component("http-firewall-checkpoint-referer-block", {
	props: ["v-checkpoint"],
	data: function () {
		let allowEmpty = true
		let allowSameDomain = true
		let allowDomains = []
		let denyDomains = []
		let checkOrigin = true

		let options = {}
		if (window.parent.UPDATING_RULE != null) {
			options = window.parent.UPDATING_RULE.checkpointOptions
		}

		if (options == null) {
			options = {}
		}
		if (typeof (options.allowEmpty) == "boolean") {
			allowEmpty = options.allowEmpty
		}
		if (typeof (options.allowSameDomain) == "boolean") {
			allowSameDomain = options.allowSameDomain
		}
		if (options.allowDomains != null && typeof (options.allowDomains) == "object") {
			allowDomains = options.allowDomains
		}
		if (options.denyDomains != null && typeof (options.denyDomains) == "object") {
			denyDomains = options.denyDomains
		}
		if (typeof options.checkOrigin == "boolean") {
			checkOrigin = options.checkOrigin
		}

		let that = this
		setTimeout(function () {
			that.change()
		}, 100)

		return {
			allowEmpty: allowEmpty,
			allowSameDomain: allowSameDomain,
			allowDomains: allowDomains,
			denyDomains: denyDomains,
			checkOrigin: checkOrigin,
			options: {},
			value: 0
		}
	},
	watch: {
		allowEmpty: function () {
			this.change()
		},
		allowSameDomain: function () {
			this.change()
		},
		checkOrigin: function () {
			this.change()
		}
	},
	methods: {
		changeAllowDomains: function (values) {
			this.allowDomains = values
			this.change()
		},
		changeDenyDomains: function (values) {
			this.denyDomains = values
			this.change()
		},
		change: function () {
			this.vCheckpoint.options = [
				{
					code: "allowEmpty",
					value: this.allowEmpty
				},
				{
					code: "allowSameDomain",
					value: this.allowSameDomain,
				},
				{
					code: "allowDomains",
					value: this.allowDomains
				},
				{
					code: "denyDomains",
					value: this.denyDomains
				},
				{
					code: "checkOrigin",
					value: this.checkOrigin
				}
			]
		}
	},
	template: `<div>
	<input type="hidden" name="operator" value="eq"/>
	<input type="hidden" name="value" :value="value"/>
	<table class="ui table">
		<tr>
			<td class="title">来源域名允许为空</td>
			<td>
				<checkbox v-model="allowEmpty"></checkbox>
				<p class="comment">允许不带来源的访问。</p>
			</td>
		</tr>
		<tr>
			<td>来源域名允许一致</td>
			<td>
				<checkbox v-model="allowSameDomain"></checkbox>
				<p class="comment">允许来源域名和当前访问的域名一致，相当于在站内访问。</p>
			</td>
		</tr>
		<tr>
			<td>允许的来源域名</td>
			<td>
				<values-box :values="allowDomains" @change="changeAllowDomains"></values-box>
				<p class="comment">允许的来源域名列表，比如<code-label>example.com</code-label>（顶级域名）、<code-label>*.example.com</code-label>（example.com的所有二级域名）。单个星号<code-label>*</code-label>表示允许所有域名。</p>
			</td>
		</tr>
		<tr>
			<td>禁止的来源域名</td>
			<td>
				<values-box :values="denyDomains" @change="changeDenyDomains"></values-box>
				<p class="comment">禁止的来源域名列表，比如<code-label>example.org</code-label>（顶级域名）、<code-label>*.example.org</code-label>（example.org的所有二级域名）；除了这些禁止的来源域名外，其他域名都会被允许，除非限定了允许的来源域名。</p>
			</td>
		</tr>
		<tr>
			<td>同时检查Origin</td>
			<td>
				<checkbox v-model="checkOrigin"></checkbox>
				<p class="comment">如果请求没有指定Referer Header，则尝试检查Origin Header，多用于跨站调用。</p>
			</td>
		</tr>
	</table>
</div>`
})

Vue.component("cache-cond-box", {
	data: function () {
		return {
			conds: [],
			addingExt: false,
			addingPath: false,

			extDuration: null,
			pathDuration: null
		}
	},
	methods: {
		addExt: function () {
			this.addingExt = !this.addingExt
			this.addingPath = false

			if (this.addingExt) {
				let that = this
				setTimeout(function () {
					if (that.$refs.extInput != null) {
						that.$refs.extInput.focus()
					}
				})
			}
		},
		changeExtDuration: function (duration) {
			this.extDuration = duration
		},
		confirmExt: function () {
			let value = this.$refs.extInput.value
			if (value.length == 0) {
				return
			}

			let exts = []
			let pieces = value.split(/[,，]/)
			pieces.forEach(function (v) {
				v = v.trim()
				v = v.replace(/\s+/, "")
				if (v.length > 0) {
					if (v[0] != ".") {
						v = "." + v
					}
					exts.push(v)
				}
			})

			this.conds.push({
				type: "url-extension",
				value: JSON.stringify(exts),
				duration: this.extDuration
			})
			this.$refs.extInput.value = ""
			this.cancel()
		},
		addPath: function () {
			this.addingExt = false
			this.addingPath = !this.addingPath

			if (this.addingPath) {
				let that = this
				setTimeout(function () {
					if (that.$refs.pathInput != null) {
						that.$refs.pathInput.focus()
					}
				})
			}
		},
		changePathDuration: function (duration) {
			this.pathDuration = duration
		},
		confirmPath: function () {
			let value = this.$refs.pathInput.value
			if (value.length == 0) {
				return
			}

			if (value[0] != "/") {
				value = "/" + value
			}

			this.conds.push({
				type: "url-prefix",
				value: value,
				duration: this.pathDuration
			})
			this.$refs.pathInput.value = ""
			this.cancel()
		},
		remove: function (index) {
			this.conds.$remove(index)
		},
		cancel: function () {
			this.addingExt = false
			this.addingPath = false
		}
	},
	template: `<div>
	<input type="hidden" name="cacheCondsJSON" :value="JSON.stringify(conds)"/>
	<div v-if="conds.length > 0">
		<div v-for="(cond, index) in conds" class="ui label basic" style="margin-top: 0.2em; margin-bottom: 0.2em">
			<span v-if="cond.type == 'url-extension'">扩展名</span>
			<span v-if="cond.type == 'url-prefix'">路径</span>：{{cond.value}} &nbsp; <span class="grey small">(<time-duration-text :v-value="cond.duration"></time-duration-text>)</span> &nbsp;
			<a href="" title="删除" @click.prevent="remove(index)"><i class="icon remove"></i></a>
		</div>
		<div class="ui divider"></div>
	</div>
	
	<!-- 添加扩展名 -->
	<div v-show="addingExt">
		<div class="ui fields inline">
			<div class="ui field">
				<input type="text" placeholder="扩展名，比如.png, .gif，英文逗号分割" style="width:20em" ref="extInput" @keyup.enter="confirmExt" @keypress.enter.prevent="1"/>
			</div>
			<div class="ui field">
				<time-duration-box placeholder="缓存时长" :v-unit="'day'" :v-count="1" @change="changeExtDuration"></time-duration-box>
			</div>
			<div class="ui field">
				<a href="" class="ui button tiny" @click.prevent="confirmExt">确定</a> &nbsp; <a href="" title="取消" @click.prevent="cancel()"><i class="icon remove small"></i></a>
			</div>
		</div>
	</div>
	
	<!-- 添加路径 -->
	<div v-show="addingPath">
		<div class="ui fields inline">
			<div class="ui field">
				<input type="text" placeholder="路径，以/开头" style="width:20em" ref="pathInput" @keyup.enter="confirmPath" @keypress.enter.prevent="1"/>
			</div>
			<div class="ui field">
				<time-duration-box placeholder="缓存时长" :v-unit="'day'" :v-count="1" @change="changePathDuration"></time-duration-box>
			</div>
			<div class="ui field">
				<a href="" class="ui button tiny" @click.prevent="confirmPath">确定</a> &nbsp; <a href="" title="取消" @click.prevent="cancel()"><i class="icon remove small"></i></a>
			</div>
		</div>
	</div>
	
	<div style="margin-top: 1em">
		<button type="button" class="ui button tiny" @click.prevent="addExt">+缓存扩展名</button> &nbsp; 
		<button type="button" class="ui button tiny" @click.prevent="addPath">+缓存路径</button>
	</div>
</div>`
})

Vue.component("ssl-certs-box", {
	props: [
		"v-certs", // 证书列表
		"v-cert", // 单个证书
		"v-protocol", // 协议：https|tls
		"v-view-size", // 弹窗尺寸：normal, mini
		"v-single-mode", // 单证书模式
		"v-description", // 描述文字
		"v-domains", // 搜索的域名列表或者函数
		"v-user-id" // 用户ID
	],
	data: function () {
		let certs = this.vCerts
		if (certs == null) {
			certs = []
		}
		if (this.vCert != null) {
			certs.push(this.vCert)
		}

		let description = this.vDescription
		if (description == null || typeof (description) != "string") {
			description = ""
		}

		return {
			certs: certs,
			description: description
		}
	},
	methods: {
		certIds: function () {
			return this.certs.map(function (v) {
				return v.id
			})
		},
		// 删除证书
		removeCert: function (index) {
			let that = this
			teaweb.confirm("确定删除此证书吗？证书数据仍然保留，只是当前网站不再使用此证书。", function () {
				that.certs.$remove(index)
			})
		},

		// 选择证书
		selectCert: function () {
			let that = this
			let width = "54em"
			let height = "32em"
			let viewSize = this.vViewSize
			if (viewSize == null) {
				viewSize = "normal"
			}
			if (viewSize == "mini") {
				width = "35em"
				height = "20em"
			}

			let searchingDomains = []
			if (this.vDomains != null) {
				if (typeof this.vDomains == "function") {
					let resultDomains = this.vDomains()
					if (resultDomains != null && typeof resultDomains == "object" && (resultDomains instanceof Array)) {
						searchingDomains = resultDomains
					}
				} else if (typeof this.vDomains == "object" && (this.vDomains instanceof Array)) {
					searchingDomains = this.vDomains
				}
				if (searchingDomains.length > 10000) {
					searchingDomains = searchingDomains.slice(0, 10000)
				}
			}

			let selectedCertIds = this.certs.map(function (cert) {
				return cert.id
			})
			let userId = this.vUserId
			if (userId == null) {
				userId = 0
			}

			teaweb.popup("/servers/certs/selectPopup?viewSize=" + viewSize + "&searchingDomains=" + window.encodeURIComponent(searchingDomains.join(",")) + "&selectedCertIds=" + selectedCertIds.join(",") + "&userId=" + userId, {
				width: width,
				height: height,
				callback: function (resp) {
					if (resp.data.cert != null) {
						that.certs.push(resp.data.cert)
					}
					if (resp.data.certs != null) {
						that.certs.$pushAll(resp.data.certs)
					}
					that.$forceUpdate()
				}
			})
		},

		// 上传证书
		uploadCert: function () {
			let that = this
			let userId = this.vUserId
			if (typeof userId != "number" && typeof userId != "string") {
				userId = 0
			}
			teaweb.popup("/servers/certs/uploadPopup?userId=" + userId, {
				height: "28em",
				callback: function (resp) {
					teaweb.success("上传成功", function () {
						if (resp.data.cert != null) {
							that.certs.push(resp.data.cert)
						}
						if (resp.data.certs != null) {
							that.certs.$pushAll(resp.data.certs)
						}
						that.$forceUpdate()
					})
				}
			})
		},

		// 批量上传
		uploadBatch: function () {
			let that = this
			let userId = this.vUserId
			if (typeof userId != "number" && typeof userId != "string") {
				userId = 0
			}
			teaweb.popup("/servers/certs/uploadBatchPopup?userId=" + userId, {
				callback: function (resp) {
					if (resp.data.cert != null) {
						that.certs.push(resp.data.cert)
					}
					if (resp.data.certs != null) {
						that.certs.$pushAll(resp.data.certs)
					}
					that.$forceUpdate()
				}
			})
		},

		// 格式化时间
		formatTime: function (timestamp) {
			return new Date(timestamp * 1000).format("Y-m-d")
		},

		// 判断是否显示选择｜上传按钮
		buttonsVisible: function () {
			return this.vSingleMode == null || !this.vSingleMode || this.certs == null || this.certs.length == 0
		}
	},
	template: `<div>
	<input type="hidden" name="certIdsJSON" :value="JSON.stringify(certIds())"/>
	<div v-if="certs != null && certs.length > 0">
		<div class="ui label small basic" v-for="(cert, index) in certs">
			{{cert.name}} / {{cert.dnsNames}} / 有效至{{formatTime(cert.timeEndAt)}} &nbsp; <a href="" title="删除" @click.prevent="removeCert(index)"><i class="icon remove"></i></a>
		</div>
		<div class="ui divider" v-if="buttonsVisible()"></div>
	</div>
	<div v-else>
		<span class="red" v-if="description.length == 0">选择或上传证书后<span v-if="vProtocol == 'https'">HTTPS</span><span v-if="vProtocol == 'tls'">TLS</span>服务才能生效。</span>
		<span class="grey" v-if="description.length > 0">{{description}}</span>
		<div class="ui divider" v-if="buttonsVisible()"></div>
	</div>
	<div v-if="buttonsVisible()">
		<button class="ui button tiny" type="button" @click.prevent="selectCert()">选择已有证书</button> &nbsp;
		<span class="disabled">|</span> &nbsp;
		<button class="ui button tiny" type="button" @click.prevent="uploadCert()">上传新证书</button> &nbsp;
		<button class="ui button tiny" type="button" @click.prevent="uploadBatch()">批量上传证书</button> &nbsp;
	</div>
</div>`
})

// HTTP CC防护配置
Vue.component("http-cc-config-box", {
	props: ["v-cc-config", "v-is-location", "v-is-group"],
	data: function () {
		let config = this.vCcConfig
		if (config == null) {
			config = {
				isPrior: false,
				isOn: false,
				enableFingerprint: true,
				enableGET302: true,
				onlyURLPatterns: [],
				exceptURLPatterns: [],
				useDefaultThresholds: true,
				ignoreCommonFiles: true
			}
		}

		if (config.thresholds == null || config.thresholds.length == 0) {
			config.thresholds = [
				{
					maxRequests: 0
				},
				{
					maxRequests: 0
				},
				{
					maxRequests: 0
				}
			]
		}

		if (typeof config.enableFingerprint != "boolean") {
			config.enableFingerprint = true
		}
		if (typeof config.enableGET302 != "boolean") {
			config.enableGET302 = true
		}

		if (config.onlyURLPatterns == null) {
			config.onlyURLPatterns = []
		}
		if (config.exceptURLPatterns == null) {
			config.exceptURLPatterns = []
		}
		return {
			config: config,
			moreOptionsVisible: false,
			minQPSPerIP: config.minQPSPerIP,
			useCustomThresholds: !config.useDefaultThresholds,

			thresholdMaxRequests0: this.maxRequestsStringAtThresholdIndex(config, 0),
			thresholdMaxRequests1: this.maxRequestsStringAtThresholdIndex(config, 1),
			thresholdMaxRequests2: this.maxRequestsStringAtThresholdIndex(config, 2)
		}
	},
	watch: {
		minQPSPerIP: function (v) {
			let qps = parseInt(v.toString())
			if (isNaN(qps) || qps < 0) {
				qps = 0
			}
			this.config.minQPSPerIP = qps
		},
		thresholdMaxRequests0: function (v) {
			this.setThresholdMaxRequests(0, v)
		},
		thresholdMaxRequests1: function (v) {
			this.setThresholdMaxRequests(1, v)
		},
		thresholdMaxRequests2: function (v) {
			this.setThresholdMaxRequests(2, v)
		},
		useCustomThresholds: function (b) {
			this.config.useDefaultThresholds = !b
		}
	},
	methods: {
		maxRequestsStringAtThresholdIndex: function (config, index) {
			if (config.thresholds == null) {
				return ""
			}
			if (index < config.thresholds.length) {
				let s = config.thresholds[index].maxRequests.toString()
				if (s == "0") {
					s = ""
				}
				return s
			}
			return ""
		},
		setThresholdMaxRequests: function (index, v) {
			let maxRequests = parseInt(v)
			if (isNaN(maxRequests) || maxRequests < 0) {
				maxRequests = 0
			}
			if (index < this.config.thresholds.length) {
				this.config.thresholds[index].maxRequests = maxRequests
			}
		},
		showMoreOptions: function () {
			this.moreOptionsVisible = !this.moreOptionsVisible
		}
	},
	template: `<div>
<input type="hidden" name="ccJSON" :value="JSON.stringify(config)"/>
<table class="ui table definition selectable">
	<prior-checkbox :v-config="config" v-if="vIsLocation || vIsGroup"></prior-checkbox>
	<tbody v-show="((!vIsLocation && !vIsGroup) || config.isPrior)">
		<tr>
			<td class="title">启用CC无感防护</td>
			<td>
				<checkbox v-model="config.isOn"></checkbox>
				<p class="comment"><plus-label></plus-label>启用后，自动检测并拦截CC攻击。</p>
			</td>
		</tr>
	</tbody>
	<tbody v-show="config.isOn">
		<tr>
			<td colspan="2"><more-options-indicator @change="showMoreOptions"></more-options-indicator></td>
		</tr>
	</tbody>
	<tbody v-show="moreOptionsVisible && config.isOn">
		<tr>
			<td>例外URL</td>
			<td>
				<url-patterns-box v-model="config.exceptURLPatterns"></url-patterns-box>
				<p class="comment">如果填写了例外URL，表示这些URL跳过CC防护不做处理。</p>
			</td>
		</tr>
		<tr>
			<td>限制URL</td>
			<td>
				<url-patterns-box v-model="config.onlyURLPatterns"></url-patterns-box>
				<p class="comment">如果填写了限制URL，表示只对这些URL进行CC防护处理；如果不填则表示支持所有的URL。</p>
			</td>
		</tr>
		<tr>
			<td>忽略常用文件</td>
			<td>
				<checkbox v-model="config.ignoreCommonFiles"></checkbox>
				<p class="comment">忽略js、css、jpg等常在网页里被引用的文件名，即对这些文件的访问不加入计数，可以减少误判几率。</p>
			</td>
		</tr>
		<tr>
			<td>检查请求来源指纹</td>
			<td>
				<checkbox v-model="config.enableFingerprint"></checkbox>
				<p class="comment">在接收到HTTPS请求时尝试检查请求来源的指纹，用来检测代理服务和爬虫攻击；如果你在网站前面放置了别的反向代理服务，请取消此选项。</p>
			</td>
		</tr>
		<tr>
			<td>启用GET302校验</td>
			<td>
				<checkbox v-model="config.enableGET302"></checkbox>
				<p class="comment">选中后，表示自动通过GET302方法来校验客户端。</p>
			</td>
		</tr>
		<tr>
			<td>单IP最低QPS</td>
			<td>
				<div class="ui input right labeled">
					<input type="text" name="minQPSPerIP" maxlength="6" style="width: 6em" v-model="minQPSPerIP"/>
					<span class="ui label">请求数/秒</span>
				</div>
				<p class="comment">当某个IP在1分钟内平均QPS达到此值时，才会开始检测；如果设置为0，表示任何访问都会检测。（注意这里设置的是检测开启阈值，不是拦截阈值，拦截阈值在当前表单下方可以设置）</p>
			</td>
		</tr>
		<tr>
			<td class="color-border">使用自定义拦截阈值</td>
			<td>
				<checkbox v-model="useCustomThresholds"></checkbox>
			</td>
		</tr>
		<tr v-show="!config.useDefaultThresholds">
			<td class="color-border">自定义拦截阈值设置</td>
			<td>
				<div>
					<div class="ui input left right labeled">
						<span class="ui label basic">单IP每5秒最多</span>
						<input type="text" style="width: 6em" maxlength="6" v-model="thresholdMaxRequests0"/>
						<span class="ui label basic">请求</span>
					</div>
				</div>
					
				<div style="margin-top: 1em">
					<div class="ui input left right labeled">
						<span class="ui label basic">单IP每60秒</span>
						<input type="text" style="width: 6em" maxlength="6" v-model="thresholdMaxRequests1"/>
						<span class="ui label basic">请求</span>
					</div>
				</div>
				<div style="margin-top: 1em">
					<div class="ui input left right labeled">
						<span class="ui label basic">单IP每300秒</span>
						<input type="text" style="width: 6em" maxlength="6" v-model="thresholdMaxRequests2"/>
						<span class="ui label basic">请求</span>
					</div>
				</div>
			</td>
		</tr>
	</tr>
	</tbody>
</table>
<div class="margin"></div>
</div>`
})

Vue.component("http-hls-config-box", {
	props: ["value", "v-is-location", "v-is-group"],
	data: function () {
		let config = this.value
		if (config == null) {
			config = {
				isPrior: false
			}
		}

		let encryptingConfig = config.encrypting
		if (encryptingConfig == null) {
			encryptingConfig = {
				isOn: false,
				onlyURLPatterns: [],
				exceptURLPatterns: []
			}
			config.encrypting = encryptingConfig
		}

		return {
			config: config,

			encryptingConfig: encryptingConfig,
			encryptingMoreOptionsVisible: false
		}
	},
	methods: {
		isOn: function () {
			return ((!this.vIsLocation && !this.vIsGroup) || this.config.isPrior)
		},

		showEncryptingMoreOptions: function () {
			this.encryptingMoreOptionsVisible = !this.encryptingMoreOptionsVisible
		}
	},
	template: `<div>
	<input type="hidden" name="hlsJSON" :value="JSON.stringify(config)"/>
	<table class="ui table definition selectable" v-show="vIsLocation || vIsGroup">
		<prior-checkbox :v-config="config" v-if="vIsLocation || vIsGroup"></prior-checkbox>
	</table>
	
	<table class="ui table definition selectable" v-show="isOn()">
		<tbody>
			<tr>
				<td class="title">启用HLS加密</td>
				<td>
					<checkbox v-model="encryptingConfig.isOn"></checkbox>
					<p class="comment">启用后，系统会自动在<code-label>.m3u8</code-label>文件中加入<code-label>#EXT-X-KEY:METHOD=AES-128...</code-label>，并将其中的<code-label>.ts</code-label>文件内容进行加密。</p>
				</td>
			</tr>
		</tbody>
		<tbody v-show="encryptingConfig.isOn">
			<tr>
				<td colspan="2"><more-options-indicator @change="showEncryptingMoreOptions"></more-options-indicator></td>
			</tr>
		</tbody>
		<tbody v-show="encryptingConfig.isOn && encryptingMoreOptionsVisible">
			<tr>
				<td>例外URL</td>
				<td>
					<url-patterns-box v-model="encryptingConfig.exceptURLPatterns"></url-patterns-box>
					<p class="comment">如果填写了例外URL，表示这些URL跳过不做处理。</p>
				</td>
			</tr>
			<tr>
				<td>限制URL</td>
				<td>
					<url-patterns-box v-model="encryptingConfig.onlyURLPatterns"></url-patterns-box>
					<p class="comment">如果填写了限制URL，表示只对这些URL进行加密处理；如果不填则表示支持所有的URL。</p>
				</td>
			</tr>	
		</tbody>
	</table>
	<div class="margin"></div>
</div>`
})

Vue.component("server-feature-required", {
	template: `<warning-message>当前网站绑定的套餐或当前用户未开通此功能。</warning-message>`
})

// 请求方法列表
Vue.component("http-status-box", {
	props: ["v-status-list"],
	data: function () {
		let statusList = this.vStatusList
		if (statusList == null) {
			statusList = []
		}
		return {
			statusList: statusList,
			isAdding: false,
			addingStatus: ""
		}
	},
	methods: {
		add: function () {
			this.isAdding = true
			let that = this
			setTimeout(function () {
				that.$refs.addingStatus.focus()
			}, 100)
		},
		confirm: function () {
			let that = this

			// 删除其中的空格
			this.addingStatus = this.addingStatus.replace(/\s/g, "").toUpperCase()

			if (this.addingStatus.length == 0) {
				teaweb.warn("请输入要添加的状态码", function () {
					that.$refs.addingStatus.focus()
				})
				return
			}

			// 是否已经存在
			if (this.statusList.$contains(this.addingStatus)) {
				teaweb.warn("此状态码已经存在，无需重复添加", function () {
					that.$refs.addingStatus.focus()
				})
				return
			}

			// 格式
			if (!this.addingStatus.match(/^\d{3}$/)) {
				teaweb.warn("请输入正确的状态码", function () {
					that.$refs.addingStatus.focus()
				})
				return
			}

			this.statusList.push(parseInt(this.addingStatus, 10))
			this.cancel()
		},
		remove: function (index) {
			this.statusList.$remove(index)
		},
		cancel: function () {
			this.isAdding = false
			this.addingStatus = ""
		}
	},
	template: `<div>
	<input type="hidden" name="statusListJSON" :value="JSON.stringify(statusList)"/>
	<div v-if="statusList.length > 0">
		<span class="ui label small basic" v-for="(status, index) in statusList">
			{{status}}
			&nbsp; <a href="" title="删除" @click.prevent="remove(index)"><i class="icon remove small"></i></a>
		</span>
		<div class="ui divider"></div>
	</div>
	<div v-if="isAdding">
		<div class="ui fields">
			<div class="ui field">
				<input type="text" v-model="addingStatus" @keyup.enter="confirm()" @keypress.enter.prevent="1" ref="addingStatus" placeholder="如200" size="3" maxlength="3" style="width: 5em"/>
			</div>
			<div class="ui field">
				<button class="ui button tiny" type="button" @click.prevent="confirm">确定</button>
				&nbsp; <a href="" title="取消" @click.prevent="cancel"><i class="icon remove small"></i></a>
			</div>
		</div>
		<p class="comment">格式为三位数字，比如<code-label>200</code-label>、<code-label>404</code-label>等。</p>
		<div class="ui divider"></div>
	</div>
	<div style="margin-top: 0.5em" v-if="!isAdding">
		<button class="ui button tiny" type="button" @click.prevent="add">+</button>
	</div>
</div>`
})

Vue.component("http-firewall-rules-box", {
	props: ["v-rules", "v-type"],
	data: function () {
		let rules = this.vRules
		if (rules == null) {
			rules = []
		}
		return {
			rules: rules
		}
	},
	methods: {
		addRule: function () {
			window.UPDATING_RULE = null
			let that = this
			teaweb.popup("/servers/components/waf/createRulePopup?type=" + this.vType, {
				height: "30em",
				callback: function (resp) {
					that.rules.push(resp.data.rule)
				}
			})
		},
		updateRule: function (index, rule) {
			window.UPDATING_RULE = teaweb.clone(rule)
			let that = this
			teaweb.popup("/servers/components/waf/createRulePopup?type=" + this.vType, {
				height: "30em",
				callback: function (resp) {
					Vue.set(that.rules, index, resp.data.rule)
				}
			})
		},
		removeRule: function (index) {
			let that = this
			teaweb.confirm("确定要删除此规则吗？", function () {
				that.rules.$remove(index)
			})
		},
		operatorName: function (operatorCode) {
			let operatorName = operatorCode
			if (typeof (window.WAF_RULE_OPERATORS) != null) {
				window.WAF_RULE_OPERATORS.forEach(function (v) {
					if (v.code == operatorCode) {
						operatorName = v.name
					}
				})
			}

			return operatorName
		},
		operatorDescription: function (operatorCode) {
			let operatorName = operatorCode
			let operatorDescription = ""
			if (typeof (window.WAF_RULE_OPERATORS) != null) {
				window.WAF_RULE_OPERATORS.forEach(function (v) {
					if (v.code == operatorCode) {
						operatorName = v.name
						operatorDescription = v.description
					}
				})
			}

			return operatorName + ": " + operatorDescription
		},
		operatorDataType: function (operatorCode) {
			let operatorDataType = "none"
			if (typeof (window.WAF_RULE_OPERATORS) != null) {
				window.WAF_RULE_OPERATORS.forEach(function (v) {
					if (v.code == operatorCode) {
						operatorDataType = v.dataType
					}
				})
			}

			return operatorDataType
		},
		calculateParamName: function (param) {
			let paramName = ""
			if (param != null) {
				window.WAF_RULE_CHECKPOINTS.forEach(function (checkpoint) {
					if (param == "${" + checkpoint.prefix + "}" || param.startsWith("${" + checkpoint.prefix + ".")) {
						paramName = checkpoint.name
					}
				})
			}
			return paramName
		},
		calculateParamDescription: function (param) {
			let paramName = ""
			let paramDescription = ""
			if (param != null) {
				window.WAF_RULE_CHECKPOINTS.forEach(function (checkpoint) {
					if (param == "${" + checkpoint.prefix + "}" || param.startsWith("${" + checkpoint.prefix + ".")) {
						paramName = checkpoint.name
						paramDescription = checkpoint.description
					}
				})
			}
			return paramName + ": " + paramDescription
		},
		isEmptyString: function (v) {
			return typeof v == "string" && v.length == 0
		}
	},
	template: `<div>
		<input type="hidden" name="rulesJSON" :value="JSON.stringify(rules)"/>
		<div v-if="rules.length > 0">
			<div v-for="(rule, index) in rules" class="ui label small basic" style="margin-bottom: 0.5em; line-height: 1.5">
				{{rule.name}} <span :title="calculateParamDescription(rule.param)" class="hover">{{calculateParamName(rule.param)}}<span class="small grey"> {{rule.param}}</span></span>
				
				<!-- cc2 -->
				<span v-if="rule.param == '\${cc2}'">
					{{rule.checkpointOptions.period}}秒内请求数
				</span>	
				
				<!-- refererBlock -->
				<span v-if="rule.param == '\${refererBlock}'">
					<span v-if="rule.checkpointOptions.allowDomains != null && rule.checkpointOptions.allowDomains.length > 0">允许{{rule.checkpointOptions.allowDomains}}</span>
					<span v-if="rule.checkpointOptions.denyDomains != null && rule.checkpointOptions.denyDomains.length > 0">禁止{{rule.checkpointOptions.denyDomains}}</span>
				</span>
				
				<span v-else>
					<span v-if="rule.paramFilters != null && rule.paramFilters.length > 0" v-for="paramFilter in rule.paramFilters"> | {{paramFilter.code}}</span> <span class="hover" :class="{dash:(!rule.isComposed && rule.isCaseInsensitive)}" :title="operatorDescription(rule.operator) + ((!rule.isComposed && rule.isCaseInsensitive) ? '\\n[大小写不敏感] ':'')">&lt;{{operatorName(rule.operator)}}&gt;</span> 
						<span v-if="!isEmptyString(rule.value)" class="hover">{{rule.value}}</span>
						<span v-else-if="operatorDataType(rule.operator) != 'none'" class="disabled" style="font-weight: normal" title="空字符串">[空]</span>
				</span>
				
				<!-- description -->
				<span v-if="rule.description != null && rule.description.length > 0" class="grey small">（{{rule.description}}）</span>
				
				<a href="" title="修改" @click.prevent="updateRule(index, rule)"><i class="icon pencil small"></i></a>
				<a href="" title="删除" @click.prevent="removeRule(index)"><i class="icon remove"></i></a>
			</div>
			<div class="ui divider"></div>
		</div>
		<button class="ui button tiny" type="button" @click.prevent="addRule()">+</button>
</div>`
})

// 缓存条件列表
Vue.component("http-cache-refs-box", {
	props: ["v-cache-refs"],
	data: function () {
		let refs = this.vCacheRefs
		if (refs == null) {
			refs = []
		}
		return {
			refs: refs
		}
	},
	methods: {
		timeUnitName: function (unit) {
			switch (unit) {
				case "ms":
					return "毫秒"
				case "second":
					return "秒"
				case "minute":
					return "分钟"
				case "hour":
					return "小时"
				case "day":
					return "天"
				case "week":
					return "周 "
			}
			return unit
		}
	},
	template: `<div>
	<input type="hidden" name="refsJSON" :value="JSON.stringify(refs)"/>
	
	<p class="comment" v-if="refs.length == 0">暂时还没有缓存条件。</p>
	<div v-show="refs.length > 0">
		<table class="ui table selectable celled">
			<thead>
				<tr>
					<th>缓存条件</th>
					<th class="width6">缓存时间</th>
				</tr>
				<tr v-for="(cacheRef, index) in refs">
					<td :class="{'color-border': cacheRef.conds != null && cacheRef.conds.connector == 'and', disabled: !cacheRef.isOn}" :style="{'border-left':cacheRef.isReverse ? '1px #db2828 solid' : ''}">
						<http-request-conds-view :v-conds="cacheRef.conds" :class="{disabled: !cacheRef.isOn}" v-if="cacheRef.conds != null && cacheRef.conds.groups != null"></http-request-conds-view>
							<http-request-cond-view :v-cond="cacheRef.simpleCond" v-if="cacheRef.simpleCond != null"></http-request-cond-view>
						
						<!-- 特殊参数 -->
						<grey-label v-if="cacheRef.key != null && cacheRef.key.indexOf('\${args}') < 0">忽略URI参数</grey-label>
						<grey-label v-if="cacheRef.minSize != null && cacheRef.minSize.count > 0">
							{{cacheRef.minSize.count}}{{cacheRef.minSize.unit}}
							<span v-if="cacheRef.maxSize != null && cacheRef.maxSize.count > 0">- {{cacheRef.maxSize.count}}{{cacheRef.maxSize.unit}}</span>
						</grey-label>
						<grey-label v-else-if="cacheRef.maxSize != null && cacheRef.maxSize.count > 0">0 - {{cacheRef.maxSize.count}}{{cacheRef.maxSize.unit}}</grey-label>
						<grey-label v-if="cacheRef.methods != null && cacheRef.methods.length > 0">{{cacheRef.methods.join(", ")}}</grey-label>
						<grey-label v-if="cacheRef.expiresTime != null && cacheRef.expiresTime.isPrior && cacheRef.expiresTime.isOn">Expires</grey-label>
						<grey-label v-if="cacheRef.status != null && cacheRef.status.length > 0 && (cacheRef.status.length > 1 || cacheRef.status[0] != 200)">状态码：{{cacheRef.status.map(function(v) {return v.toString()}).join(", ")}}</grey-label>
						<grey-label v-if="cacheRef.allowPartialContent">分片缓存</grey-label>
						<grey-label v-if="cacheRef.alwaysForwardRangeRequest">Range回源</grey-label>
						<grey-label v-if="cacheRef.enableIfNoneMatch">If-None-Match</grey-label>
						<grey-label v-if="cacheRef.enableIfModifiedSince">If-Modified-Since</grey-label>
						<grey-label v-if="cacheRef.enableReadingOriginAsync">支持异步</grey-label>
					</td>
					<td :class="{disabled: !cacheRef.isOn}">
						<span v-if="!cacheRef.isReverse">{{cacheRef.life.count}} {{timeUnitName(cacheRef.life.unit)}}</span>
						<span v-else class="red">不缓存</span>
					</td>
				</tr>
			</thead>
		</table>
	</div>
	<div class="margin"></div>
</div>`
})

Vue.component("message-row", {
    props: ["v-message"],
    data: function () {
        let paramsJSON = this.vMessage.params
        let params = null
        if (paramsJSON != null && paramsJSON.length > 0) {
            params = JSON.parse(paramsJSON)
        }

        return {
            message: this.vMessage,
            params: params
        }
    },
    methods: {
        viewCert: function (certId) {
            teaweb.popup("/servers/certs/certPopup?certId=" + certId, {
                height: "28em",
                width: "48em"
            })
        },
        readMessage: function (messageId) {
            Tea.action("/messages/readPage")
                .params({"messageIds": [messageId]})
                .post()
                .success(function () {
                    teaweb.reload()
                })
        }
    },
    template: `<div>
<table class="ui table selectable">
	<tr :class="{error: message.level == 'error', positive: message.level == 'success', warning: message.level == 'warning'}">
		<td style="position: relative">
			<strong>{{message.datetime}}</strong>
			<span v-if="message.cluster != null && message.cluster.id != null">
				<span> | </span>
				<a :href="'/clusters/cluster?clusterId=' + message.cluster.id">集群：{{message.cluster.name}}</a>
			</span>
			<span v-if="message.node != null && message.node.id != null">
				<span> | </span>
				<a :href="'/clusters/cluster/node?clusterId=' + message.cluster.id + '&nodeId=' + message.node.id">节点：{{message.node.name}}</a>
			</span>
			<a href=""  style="position: absolute; right: 1em" @click.prevent="readMessage(message.id)" title="标为已读"><i class="icon check"></i></a>
		</td>
	</tr>
	<tr :class="{error: message.level == 'error', positive: message.level == 'success', warning: message.level == 'warning'}">
		<td>
			<pre style="padding: 0; margin:0; word-break: break-all;">{{message.body}}</pre>
			
			<!-- 健康检查 -->
			<div v-if="message.type == 'HealthCheckFailed'" style="margin-top: 0.8em">
				<a :href="'/clusters/cluster/node?clusterId=' + message.cluster.id + '&nodeId=' + param.node.id" v-for="param in params" class="ui label small basic" style="margin-bottom: 0.5em">{{param.node.name}}: {{param.error}}</a>
			</div>
			
			<!-- 集群DNS设置 -->
			<div v-if="message.type == 'ClusterDNSSyncFailed'" style="margin-top: 0.8em">
				<a :href="'/dns/clusters/cluster?clusterId=' + message.cluster.id">查看问题 &raquo;</a>
			</div>
			
			<!-- 证书即将过期 -->
			<div v-if="message.type == 'SSLCertExpiring'" style="margin-top: 0.8em">
				<a href="" @click.prevent="viewCert(params.certId)">查看证书</a><span v-if="params != null && params.acmeTaskId > 0"> &nbsp;|&nbsp; <a :href="'/servers/certs/acme'">查看任务&raquo;</a></span>
			</div>
			
			<!-- 证书续期成功 -->
			<div v-if="message.type == 'SSLCertACMETaskSuccess'" style="margin-top: 0.8em">
				<a href="" @click.prevent="viewCert(params.certId)">查看证书</a> &nbsp;|&nbsp; <a :href="'/servers/certs/acme'" v-if="params != null && params.acmeTaskId > 0">查看任务&raquo;</a>
			</div>
			<div v-if="message.type == 'SSLCertACMETaskFailed'" style="margin-top: 0.8em">
				<a href="" @click.prevent="viewCert(params.certId)">查看证书</a> &nbsp;|&nbsp; <a :href="'/servers/certs/acme'" v-if="params != null && params.acmeTaskId > 0">查看任务&raquo;</a>
			</div>
			
			<!-- 网站审核通过 -->
			<div v-if="message.type == 'ServerNamesAuditingSuccess'">
				<a :href="'/servers/server?serverId=' + params.serverId">去查看&raquo;</a>
			</div>
			
			<!-- 网站审核失败 -->
			<div v-if="message.type == 'ServerNamesAuditingFailed'">
				<a :href="'/servers/server?serverId=' + params.serverId">去查看&raquo;</a>
			</div>
		</td>
	</tr>
</table>
<div class="margin"></div>
</div>`
})

Vue.component("plan-bandwidth-limit-view", {
	props: ["value"],
	template: `<div style="font-size: 0.8em; color: grey" v-if="value != null && value.bandwidthLimitPerNode != null && value.bandwidthLimitPerNode.count > 0">
	带宽限制：<bandwidth-size-capacity-view :v-value="value.bandwidthLimitPerNode"></bandwidth-size-capacity-view>
</div>`
})

// 显示流量限制说明
Vue.component("plan-limit-view", {
	props: ["value", "v-single-mode"],
	data: function () {
		let config = this.value

		let hasLimit = false
		if (!this.vSingleMode) {
			if (config.trafficLimit != null && config.trafficLimit.isOn && ((config.trafficLimit.dailySize != null && config.trafficLimit.dailySize.count > 0) || (config.trafficLimit.monthlySize != null && config.trafficLimit.monthlySize.count > 0))) {
				hasLimit = true
			} else if (config.dailyRequests > 0 || config.monthlyRequests > 0) {
				hasLimit = true
			}
		}

		return {
			config: config,
			hasLimit: hasLimit
		}
	},
	methods: {
		formatNumber: function (n) {
			return teaweb.formatNumber(n)
		},
		composeCapacity: function (capacity) {
			return teaweb.convertSizeCapacityToString(capacity)
		}
	},
	template: `<div style="font-size: 0.8em; color: grey">
	<div class="ui divider" v-if="hasLimit"></div>
	<div v-if="config.trafficLimit != null && config.trafficLimit.isOn">
		<span v-if="config.trafficLimit.dailySize != null && config.trafficLimit.dailySize.count > 0">日流量限制：{{composeCapacity(config.trafficLimit.dailySize)}}<br/></span>
		<span v-if="config.trafficLimit.monthlySize != null && config.trafficLimit.monthlySize.count > 0">月流量限制：{{composeCapacity(config.trafficLimit.monthlySize)}}<br/></span>
	</div>
	<div v-if="config.dailyRequests > 0">单日请求数限制：{{formatNumber(config.dailyRequests)}}</div>
	<div v-if="config.monthlyRequests > 0">单月请求数限制：{{formatNumber(config.monthlyRequests)}}</div>
	<div v-if="config.dailyWebsocketConnections > 0">单日Websocket限制：{{formatNumber(config.dailyWebsocketConnections)}}</div>
	<div v-if="config.monthlyWebsocketConnections > 0">单月Websocket限制：{{formatNumber(config.monthlyWebsocketConnections)}}</div>
	<div v-if="config.maxUploadSize != null && config.maxUploadSize.count > 0">文件上传限制：{{composeCapacity(config.maxUploadSize)}}</div>
</div>`
})

Vue.component("plan-price-view", {
	props: ["v-plan"],
	data: function () {
		return {
			plan: this.vPlan
		}
	},
	template: `<div>
	 <span v-if="plan.priceType == 'period'">
	 	按时间周期计费
	 	<div>
	 		<span class="grey small">
				<span v-if="plan.monthlyPrice > 0">月度：￥{{plan.monthlyPrice}}元<br/></span>
				<span v-if="plan.seasonallyPrice > 0">季度：￥{{plan.seasonallyPrice}}元<br/></span>
				<span v-if="plan.yearlyPrice > 0">年度：￥{{plan.yearlyPrice}}元</span>
			</span>
		</div>
	</span>
	<span v-if="plan.priceType == 'traffic'">
		按流量计费
		<div>
			<span class="grey small">基础价格：￥{{plan.trafficPrice.base}}元/GiB</span>
		</div>
	</span>
	<div v-if="plan.priceType == 'bandwidth' && plan.bandwidthPrice != null && plan.bandwidthPrice.percentile > 0">
		按{{plan.bandwidthPrice.percentile}}th带宽计费 
		<div>
			<div v-for="range in plan.bandwidthPrice.ranges">
				<span class="small grey">{{range.minMB}} - <span v-if="range.maxMB > 0">{{range.maxMB}}MiB</span><span v-else>&infin;</span>： <span v-if="range.totalPrice > 0">{{range.totalPrice}}元</span><span v-else="">{{range.pricePerMB}}元/MiB</span></span>
			</div>
		</div>
	</div>
</div>`
})

Vue.component("pay-method-selector", {
	mounted: function () {
		this.$emit("change", this.currentMethodCode)

		let that = this
		Tea.action("/finance/methodOptions")
			.success(function (resp) {
				that.isLoading = false
				that.balance = resp.data.balance
				that.methods = resp.data.methods
				that.canPay = resp.data.enablePay
			})
			.post()
	},
	data: function () {
		return {
			isLoading: true,
			canPay: true,
			balance: 0,
			methods: [],
			currentMethodCode: "@balance"
		}
	},
	methods: {
		selectMethod: function (method) {
			this.currentMethodCode = method.code
			this.$emit("change", method.code)
		}
	},
	template: `<div>
<div class="methods-box" v-if="!isLoading && canPay">
	<div class="method-box" @click.prevent="selectMethod({'code':'@balance'})">
		<radio name="methodCode" :value="'@balance'" :v-value="'@balance'">余额支付 <span class="grey small">（{{balance}}元）</span></radio>
		<p class="comment">使用余额支付</p>
	</div>
	<div class="method-box" :class="{active: currentMethodCode == method.code}" v-for="method in methods" @click.event="selectMethod(method)">
		<radio name="methodCode" :value="method.code" :v-value="method.code" v-model="currentMethodCode">{{method.name}}</radio>
		<p class="comment">{{method.description}}</p>
	</div>
</div>

<div v-if="!isLoading && !canPay">
	暂时不支持线上支付，请联系客服购买。
</div>

</div>`
})

Vue.component("ad-instance-objects-box", {
	props: ["v-objects", "v-user-id"],
	mounted: function () {
		this.getUserServers(1)
	},
	data: function () {
		let objects = this.vObjects
		if (objects == null) {
			objects = []
		}

		let objectCodes = []
		objects.forEach(function (v) {
			objectCodes.push(v.code)
		})

		return {
			userId: this.vUserId,
			objects: objects,
			objectCodes: objectCodes,
			isAdding: true,

			servers: [],
			serversIsLoading: false
		}
	},
	methods: {
		add: function () {
			this.isAdding = true
		},
		cancel: function () {
			this.isAdding = false
		},
		remove: function (index) {
			let that = this
			teaweb.confirm("确定要删除此防护对象吗？", function () {
				that.objects.$remove(index)
				that.notifyChange()
			})
		},
		removeObjectCode: function (objectCode) {
			let index = -1
			this.objectCodes.forEach(function (v, k) {
				if (objectCode == v) {
					index = k
				}
			})
			if (index >= 0) {
				this.objects.$remove(index)
				this.notifyChange()
			}
		},
		getUserServers: function (page) {
			if (Tea.Vue == null) {
				let that = this
				setTimeout(function () {
					that.getUserServers(page)
				}, 100)
				return
			}

			let that = this
			this.serversIsLoading = true
			Tea.Vue.$post(".userServers")
				.params({
					userId: this.userId,
					page: page,
					pageSize: 5
				})
				.success(function (resp) {
					that.servers = resp.data.servers

					that.$refs.serverPage.updateMax(resp.data.page.max)
					that.serversIsLoading = false
				})
				.error(function () {
					that.serversIsLoading = false
				})
		},
		changeServerPage: function (page) {
			this.getUserServers(page)
		},
		selectServerObject: function (server) {
			if (this.existObjectCode("server:" + server.id)) {
				return
			}

			this.objects.push({
				"type": "server",
				"code": "server:" + server.id,

				"id": server.id,
				"name": server.name
			})
			this.notifyChange()
		},
		notifyChange: function () {
			let objectCodes = []
			this.objects.forEach(function (v) {
				objectCodes.push(v.code)
			})
			this.objectCodes = objectCodes
		},
		existObjectCode: function (objectCode) {
			let found = false
			this.objects.forEach(function (v) {
				if (v.code == objectCode) {
					found = true
				}
			})
			return found
		}
	},
	template: `<div>
	<input type="hidden" name="objectCodesJSON" :value="JSON.stringify(objectCodes)"/>
	
	<!-- 已有对象 -->
	<div>
		<div v-if="objects.length == 0"><span class="grey">暂时还没有设置任何防护对象。</span></div>
		<div v-if="objects.length > 0">
			<table class="ui table">
				<tr>
					<td class="title">已选中防护对象</td>
					<td>
						<div v-for="(object, index) in objects" class="ui label basic small" style="margin-bottom: 0.5em">
							<span v-if="object.type == 'server'">网站：{{object.name}}</span>
							&nbsp; <a href="" title="删除" @click.prevent="remove(index)"><i class="icon remove small"></i></a>
						</div>
					</td>
				</tr>
			</table>
		</div>
	</div>
	<div class="margin"></div>
	
	<!-- 添加表单 -->
	<div v-if="isAdding">
		<table class="ui table celled">
			<tr>
				<td class="title">对象类型</td>
				<td>网站</td>
			</tr>
			<!-- 网站列表 -->
			<tr>
				<td>网站列表</td>
				<td>
					<span v-if="serversIsLoading">加载中...</span>
					<div v-if="!serversIsLoading && servers.length == 0">暂时还没有可选的网站。</div>
					<table class="ui table" v-show="!serversIsLoading && servers.length > 0">
						<thead class="full-width">
							<tr>
								<th>网站名称</th>
								<th class="one op">操作</th>
							</tr>	
						</thead>
						<tr v-for="server in servers">
							<td style="background: white">{{server.name}}</td>
							<td>
								<a href="" @click.prevent="selectServerObject(server)" v-if="!existObjectCode('server:' + server.id)">选中</a>
								<a href="" @click.prevent="removeObjectCode('server:' + server.id)" v-else><span class="red">取消</span></a>
							</td>
						</tr>
					</table>
					
					<js-page ref="serverPage" @change="changeServerPage"></js-page>
				</td>
			</tr>
		</table>
	</div>
	
	<!-- 添加按钮 -->
	<div v-if="!isAdding">
		<button class="ui button tiny" type="button" @click.prevent="add">+</button>
	</div>
</div>`
})

Vue.component("ns-domain-group-selector", {
	props: ["v-domain-group-id"],
	data: function () {
		let groupId = this.vDomainGroupId
		if (groupId == null) {
			groupId = 0
		}
		return {
			userId: 0,
			groupId: groupId
		}
	},
	methods: {
		change: function (group) {
			if (group != null) {
				this.$emit("change", group.id)
			} else {
				this.$emit("change", 0)
			}
		},
		reload: function (userId) {
			this.userId = userId
			this.$refs.comboBox.clear()
			this.$refs.comboBox.setDataURL("/ns/domains/groups/options?userId=" + userId)
			this.$refs.comboBox.reloadData()
		}
	},
	template: `<div>
	<combo-box 
		data-url="/ns/domains/groups/options" 
		placeholder="选择分组" 
		data-key="groups" 
		name="groupId"
		:v-value="groupId" 
		@change="change"
		ref="comboBox">	
	</combo-box>
</div>`
})

// 选择单一线路
Vue.component("ns-route-selector", {
	props: ["v-route-code"],
	mounted: function () {
		let that = this
		Tea.action("/ns/routes/options")
			.post()
			.success(function (resp) {
				that.routes = resp.data.routes
			})
	},
	data: function () {
		let routeCode = this.vRouteCode
		if (routeCode == null) {
			routeCode = ""
		}
		return {
			routeCode: routeCode,
			routes: []
		}
	},
	template: `<div>
	<div v-if="routes.length > 0">
		<select class="ui dropdown" name="routeCode" v-model="routeCode">
			<option value="">[线路]</option>
			<option v-for="route in routes" :value="route.code">{{route.name}}</option>
		</select>
	</div>
</div>`
})

Vue.component("ns-access-log-ref-box", {
	props: ["v-access-log-ref", "v-is-parent"],
	data: function () {
		let config = this.vAccessLogRef
		if (config == null) {
			config = {
				isOn: false,
				isPrior: false,
				logMissingDomains: false
			}
		}
		if (typeof (config.logMissingDomains) == "undefined") {
			config.logMissingDomains = false
		}
		return {
			config: config
		}
	},
	template: `<div>
	<input type="hidden" name="accessLogJSON" :value="JSON.stringify(config)"/>
	<table class="ui table definition selectable">
		<prior-checkbox :v-config="config" v-if="!vIsParent"></prior-checkbox>
		<tbody v-show="vIsParent || config.isPrior">
			<tr>
				<td class="title">启用</td>
				<td>
					<checkbox name="isOn" value="1" v-model="config.isOn"></checkbox>
				</td>
			</tr>
			<tr>
				<td>记录所有访问</td>
				<td>
					<checkbox name="logMissingDomains" value="1" v-model="config.logMissingDomains"></checkbox>
					<p class="comment">包括对没有在系统里创建的域名访问。</p>
				</td>
			</tr>
		</tbody>
	</table>
	<div class="margin"></div>
</div>`
})

Vue.component("ns-record-health-check-config-box", {
	props:["value", "v-parent-config"],
	data: function () {
		let config = this.value
		if (config == null) {
			config = {
				isOn: false,
				port: 0,
				timeoutSeconds: 0,
				countUp: 0,
				countDown: 0
			}
		}

		let parentConfig = this.vParentConfig

		return {
			config: config,
			portString: config.port.toString(),
			timeoutSecondsString: config.timeoutSeconds.toString(),
			countUpString: config.countUp.toString(),
			countDownString: config.countDown.toString(),

			portIsEditing: config.port > 0,
			timeoutSecondsIsEditing: config.timeoutSeconds > 0,
			countUpIsEditing: config.countUp > 0,
			countDownIsEditing: config.countDown > 0,

			parentConfig: parentConfig
		}
	},
	watch: {
		portString: function (value) {
			let port = parseInt(value.toString())
			if (isNaN(port) || port > 65535 || port < 1) {
				this.config.port = 0
			} else {
				this.config.port = port
			}
		},
		timeoutSecondsString: function (value) {
			let timeoutSeconds = parseInt(value.toString())
			if (isNaN(timeoutSeconds) || timeoutSeconds > 1000 || timeoutSeconds < 1) {
				this.config.timeoutSeconds = 0
			} else {
				this.config.timeoutSeconds = timeoutSeconds
			}
		},
		countUpString: function (value) {
			let countUp = parseInt(value.toString())
			if (isNaN(countUp) || countUp > 1000 || countUp < 1) {
				this.config.countUp = 0
			} else {
				this.config.countUp = countUp
			}
		},
		countDownString: function (value) {
			let countDown = parseInt(value.toString())
			if (isNaN(countDown) || countDown > 1000 || countDown < 1) {
				this.config.countDown = 0
			} else {
				this.config.countDown = countDown
			}
		}
	},
	template: `<div>
	<input type="hidden" name="recordHealthCheckJSON" :value="JSON.stringify(config)"/>
	<table class="ui table definition selectable">
		<tbody>
			<tr>
				<td class="title">启用当前记录健康检查</td>
				<td>
					<checkbox v-model="config.isOn"></checkbox>
				</td>
			</tr>
		</tbody>
		<tbody v-show="config.isOn">
			<tr>
				<td>检测端口</td>
				<td>
					<span v-if="!portIsEditing" class="grey">
						默认{{parentConfig.port}}
						&nbsp; <a href="" @click.prevent="portIsEditing = true; portString = parentConfig.port">[修改]</a>
					</span>
					<div v-show="portIsEditing">
						<div style="margin-bottom: 0.5em">
							<a href="" @click.prevent="portIsEditing = false; portString = '0'">[使用默认]</a>
						</div>
						<input type="text" v-model="portString" maxlength="5" style="width: 5em"/>
						<p class="comment">通过尝试连接A/AAAA记录中的IP加此端口来确定当前记录是否健康。</p>
					</div>
				</td>
			</tr>
			<tr>
				<td>超时时间</td>
				<td>
					<span v-if="!timeoutSecondsIsEditing" class="grey">
						默认{{parentConfig.timeoutSeconds}}秒
						&nbsp; <a href="" @click.prevent="timeoutSecondsIsEditing = true; timeoutSecondsString = parentConfig.timeoutSeconds">[修改]</a>
					</span>
					<div v-show="timeoutSecondsIsEditing">
						<div style="margin-bottom: 0.5em">
							<a href="" @click.prevent="timeoutSecondsIsEditing = false; timeoutSecondsString = '0'">[使用默认]</a>
						</div>
						<div class="ui input right labeled">
							<input type="text" style="width: 4em" v-model="timeoutSecondsString" maxlength="3"/>
							<span class="ui label">秒</span>
						</div>
					</div>
				</td>
			</tr>
			<tr>
				<td>默认连续上线次数</td>
				<td>
					<span v-if="!countUpIsEditing" class="grey">
						默认{{parentConfig.countUp}}次
						&nbsp; <a href="" @click.prevent="countUpIsEditing = true; countUpString = parentConfig.countUp">[修改]</a>
					</span>
					<div v-show="countUpIsEditing">
						<div style="margin-bottom: 0.5em">
							<a href="" @click.prevent="countUpIsEditing = false; countUpString = '0'">[使用默认]</a>
						</div>
						<div class="ui input right labeled">
							<input type="text" style="width: 4em" v-model="countUpString" maxlength="3"/>
							<span class="ui label">次</span>
						</div>
						<p class="comment">连续检测<span v-if="config.countUp > 0">{{config.countUp}}</span><span v-else>N</span>次成功后，认为当前记录是在线的。</p>
					</div>
				</td>
			</tr>
			<tr>
				<td>默认连续下线次数</td>
				<td>
					<span v-if="!countDownIsEditing" class="grey">
						默认{{parentConfig.countDown}}次
						&nbsp; <a href="" @click.prevent="countDownIsEditing = true; countDownString = parentConfig.countDown">[修改]</a>
					</span>
					<div v-show="countDownIsEditing">
						<div style="margin-bottom: 0.5em">
							<a href="" @click.prevent="countDownIsEditing = false; countDownString = '0'">[使用默认]</a>
						</div>
						<div class="ui input right labeled">
							<input type="text" style="width: 4em" v-model="countDownString" maxlength="3"/>
							<span class="ui label">次</span>
						</div>
						<p class="comment">连续检测<span v-if="config.countDown > 0">{{config.countDown}}</span><span v-else>N</span>次失败后，认为当前记录是离线的。</p>
					</div>
				</td>
			</tr>
		</tbody>
	</table>
	<div class="margin"></div>
</div>`
})

// 递归DNS设置
Vue.component("ns-recursion-config-box", {
	props: ["v-recursion-config"],
	data: function () {
		let recursion = this.vRecursionConfig
		if (recursion == null) {
			recursion = {
				isOn: false,
				hosts: [],
				allowDomains: [],
				denyDomains: [],
				useLocalHosts: false
			}
		}
		if (recursion.hosts == null) {
			recursion.hosts = []
		}
		if (recursion.allowDomains == null) {
			recursion.allowDomains = []
		}
		if (recursion.denyDomains == null) {
			recursion.denyDomains = []
		}
		return {
			config: recursion,
			hostIsAdding: false,
			host: "",
			updatingHost: null
		}
	},
	methods: {
		changeHosts: function (hosts) {
			this.config.hosts = hosts
		},
		changeAllowDomains: function (domains) {
			this.config.allowDomains = domains
		},
		changeDenyDomains: function (domains) {
			this.config.denyDomains = domains
		},
		removeHost: function (index) {
			this.config.hosts.$remove(index)
		},
		addHost: function () {
			this.updatingHost = null
			this.host = ""
			this.hostIsAdding = !this.hostIsAdding
			if (this.hostIsAdding) {
				var that = this
				setTimeout(function () {
					let hostRef = that.$refs.hostRef
					if (hostRef != null) {
						hostRef.focus()
					}
				}, 200)
			}
		},
		updateHost: function (host) {
			this.updatingHost = host
			this.host = host.host
			this.hostIsAdding = !this.hostIsAdding

			if (this.hostIsAdding) {
				var that = this
				setTimeout(function () {
					let hostRef = that.$refs.hostRef
					if (hostRef != null) {
						hostRef.focus()
					}
				}, 200)
			}
		},
		confirmHost: function () {
			if (this.host.length == 0) {
				teaweb.warn("请输入DNS地址")
				return
			}

			// TODO 校验Host
			// TODO 可以输入端口号
			// TODO 可以选择协议

			this.hostIsAdding = false
			if (this.updatingHost == null) {
				this.config.hosts.push({
					host: this.host
				})
			} else {
				this.updatingHost.host = this.host
			}
		},
		cancelHost: function () {
			this.hostIsAdding = false
		}
	},
	template: `<div>
	<input type="hidden" name="recursionJSON" :value="JSON.stringify(config)"/>
	<table class="ui table definition selectable">
		<tbody>
			<tr>
				<td class="title">启用</td>
				<td>
					<div class="ui checkbox">
						<input type="checkbox" name="isOn" value="1" v-model="config.isOn"/>
						<label></label>
					</div>
					<p class="comment">启用后，如果找不到某个域名的解析记录，则向上一级DNS查找。</p>
				</td>
			</tr>
		</tbody>
		<tbody v-show="config.isOn">
			<tr>
				<td>从节点本机读取<br/>上级DNS主机</td>
				<td>
					<div class="ui checkbox">
						<input type="checkbox" name="useLocalHosts" value="1" v-model="config.useLocalHosts"/>
						<label></label>
					</div>
					<p class="comment">选中后，节点会试图从<code-label>/etc/resolv.conf</code-label>文件中读取DNS配置。 </p>
				</td>
			</tr>
			<tr v-show="!config.useLocalHosts">
				<td>上级DNS主机地址 *</td>
				<td>
					<div v-if="config.hosts.length > 0">
						<div v-for="(host, index) in config.hosts" class="ui label tiny basic">
							{{host.host}} &nbsp;
							<a href="" title="修改" @click.prevent="updateHost(host)"><i class="icon pencil tiny"></i></a>
							<a href="" title="删除" @click.prevent="removeHost(index)"><i class="icon remove small"></i></a>
						</div>
						<div class="ui divider"></div>
					</div>
					<div v-if="hostIsAdding">
						<div class="ui fields inline">
							<div class="ui field">
								<input type="text" placeholder="DNS主机地址" v-model="host" ref="hostRef" @keyup.enter="confirmHost" @keypress.enter.prevent="1"/>
							</div>
							<div class="ui field">
								<button class="ui button tiny" type="button" @click.prevent="confirmHost">确认</button> &nbsp; <a href="" title="取消" @click.prevent="cancelHost"><i class="icon remove small"></i></a>
							</div>
						</div>
					</div>
					<div style="margin-top: 0.5em">
						<button type="button" class="ui button tiny" @click.prevent="addHost">+</button>
					</div>
				</td>
			</tr>
			<tr>
				<td>允许的域名</td>
				<td><values-box name="allowDomains" :values="config.allowDomains" @change="changeAllowDomains"></values-box>
					<p class="comment">支持星号通配符，比如<code-label>*.example.org</code-label>。</p>
				</td>
			</tr>
			<tr>
				<td>不允许的域名</td>
				<td>
					<values-box name="denyDomains" :values="config.denyDomains" @change="changeDenyDomains"></values-box>
					<p class="comment">支持星号通配符，比如<code-label>*.example.org</code-label>。优先级比允许的域名高。</p>
				</td>
			</tr>
		</tbody>
	</table>
	<div class="margin"></div>
</div>`
})

Vue.component("ns-records-health-check-config-box", {
	props:["value"],
	data: function () {
		let config = this.value
		if (config == null) {
			config = {
				isOn: false,
				port: 80,
				timeoutSeconds: 5,
				countUp: 1,
				countDown: 3
			}
		}
		return {
			config: config,
			portString: config.port.toString(),
			timeoutSecondsString: config.timeoutSeconds.toString(),
			countUpString: config.countUp.toString(),
			countDownString: config.countDown.toString()
		}
	},
	watch: {
		portString: function (value) {
			let port = parseInt(value.toString())
			if (isNaN(port) || port > 65535 || port < 1) {
				this.config.port = 80
			} else {
				this.config.port = port
			}
		},
		timeoutSecondsString: function (value) {
			let timeoutSeconds = parseInt(value.toString())
			if (isNaN(timeoutSeconds) || timeoutSeconds > 1000 || timeoutSeconds < 1) {
				this.config.timeoutSeconds = 5
			} else {
				this.config.timeoutSeconds = timeoutSeconds
			}
		},
		countUpString: function (value) {
			let countUp = parseInt(value.toString())
			if (isNaN(countUp) || countUp > 1000 || countUp < 1) {
				this.config.countUp = 1
			} else {
				this.config.countUp = countUp
			}
		},
		countDownString: function (value) {
			let countDown = parseInt(value.toString())
			if (isNaN(countDown) || countDown > 1000 || countDown < 1) {
				this.config.countDown = 3
			} else {
				this.config.countDown = countDown
			}
		}
	},
	template: `<div>
	<input type="hidden" name="recordsHealthCheckJSON" :value="JSON.stringify(config)"/>
	<table class="ui table definition selectable">
		<tbody>
			<tr>
				<td class="title">启用健康检查</td>
				<td>
					<checkbox v-model="config.isOn"></checkbox>
					<p class="comment">选中后，表示启用当前域名下A/AAAA记录的健康检查；启用此设置后，你仍需设置单个A/AAAA记录的健康检查。</p>
				</td>
			</tr>
		</tbody>
		<tbody v-show="config.isOn">
			<tr>
				<td>默认检测端口</td>
				<td>
					<input type="text" v-model="portString" maxlength="5" style="width: 5em"/>
					<p class="comment">通过尝试连接A/AAAA记录中的IP加此端口来确定当前记录是否健康。</p>
				</td>
			</tr>
			<tr>
				<td>默认超时时间</td>
				<td>
					<div class="ui input right labeled">
						<input type="text" style="width: 4em" v-model="timeoutSecondsString" maxlength="3"/>
						<span class="ui label">秒</span>
					</div>
				</td>
			</tr>
			<tr>
				<td>默认连续上线次数</td>
				<td>
					<div class="ui input right labeled">
						<input type="text" style="width: 4em" v-model="countUpString" maxlength="3"/>
						<span class="ui label">次</span>
					</div>
					<p class="comment">连续检测<span v-if="config.countUp > 0">{{config.countUp}}</span><span v-else>N</span>次成功后，认为当前记录是在线的。</p>
				</td>
			</tr>
			<tr>
				<td>默认连续下线次数</td>
				<td>
					<div class="ui input right labeled">
						<input type="text" style="width: 4em" v-model="countDownString" maxlength="3"/>
						<span class="ui label">次</span>
					</div>
					<p class="comment">连续检测<span v-if="config.countDown > 0">{{config.countDown}}</span><span v-else>N</span>次失败后，认为当前记录是离线的。</p>
				</td>
			</tr>
		</tbody>
	</table>
	<div class="margin"></div>
</div>`
})

// 选择多个线路
Vue.component("ns-routes-selector", {
	props: ["v-routes", "name"],
	mounted: function () {
		let that = this
		Tea.action("/ns/routes/options")
			.post()
			.success(function (resp) {
				that.routes = resp.data.routes
				that.supportChinaProvinceRoutes = resp.data.supportChinaProvinceRoutes
				that.supportISPRoutes = resp.data.supportISPRoutes
				that.supportWorldRegionRoutes = resp.data.supportWorldRegionRoutes
				that.supportAgentRoutes = resp.data.supportAgentRoutes
				that.publicCategories = resp.data.publicCategories
				that.supportPublicRoutes = resp.data.supportPublicRoutes

				// provinces
				let provinces = {}
				if (resp.data.provinces != null && resp.data.provinces.length > 0) {
					for (const province of resp.data.provinces) {
						let countryCode = province.countryCode
						if (typeof provinces[countryCode] == "undefined") {
							provinces[countryCode] = []
						}
						provinces[countryCode].push({
							name: province.name,
							code: province.code
						})
					}
				}
				that.provinces = provinces
			})
	},
	data: function () {
		let selectedRoutes = this.vRoutes
		if (selectedRoutes == null) {
			selectedRoutes = []
		}

		let inputName = this.name
		if (typeof inputName != "string" || inputName.length == 0) {
			inputName = "routeCodes"
		}

		return {
			routeCode: "default",
			inputName: inputName,
			routes: [],


			provinces: {}, // country code => [ province1, province2, ... ]
			provinceRouteCode: "",

			isAdding: false,
			routeType: "default",
			selectedRoutes: selectedRoutes,

			supportChinaProvinceRoutes: false,
			supportISPRoutes: false,
			supportWorldRegionRoutes: false,
			supportAgentRoutes: false,
			supportPublicRoutes: false,
			publicCategories: []
		}
	},
	watch: {
		routeType: function (v) {
			this.routeCode = ""
			let that = this
			this.routes.forEach(function (route) {
				if (route.type == v && that.routeCode.length == 0) {
					that.routeCode = route.code
				}
			})
		}
	},
	methods: {
		add: function () {
			this.isAdding = true
			this.routeType = "default"
			this.routeCode = "default"
			this.provinceRouteCode = ""
			this.$emit("add")
		},
		cancel: function () {
			this.isAdding = false
			this.$emit("cancel")
		},
		confirm: function () {
			if (this.routeCode.length == 0) {
				return
			}

			let that = this


			// route
			let selectedRoute = null
			for (const route of this.routes) {
				if (route.code == this.routeCode) {
					selectedRoute = route
					break
				}
			}

			if (selectedRoute != null) {
				// province route
				if (this.provinceRouteCode.length > 0 && this.provinces[this.routeCode] != null) {
					for (const province of this.provinces[this.routeCode]) {
						if (province.code == this.provinceRouteCode) {
							selectedRoute = {
								name: selectedRoute.name + "-" + province.name,
								code: province.code
							}
							break
						}
					}
				}

				that.selectedRoutes.push(selectedRoute)
			}

			this.$emit("change", this.selectedRoutes)
			this.cancel()
		},
		remove: function (index) {
			this.selectedRoutes.$remove(index)
			this.$emit("change", this.selectedRoutes)
		}
	}
	,
	template: `<div>
	<div v-show="selectedRoutes.length > 0">
		<div class="ui label basic text small" v-for="(route, index) in selectedRoutes" style="margin-bottom: 0.3em">
			<input type="hidden" :name="inputName" :value="route.code"/>
			{{route.name}} &nbsp; <a href="" title="删除" @click.prevent="remove(index)"><i class="icon remove small"></i></a>
		</div>
		<div class="ui divider"></div>
	</div>
	<div v-if="isAdding" style="margin-bottom: 1em">
		<table class="ui table">
			<tr>
				<td class="title">选择类型 *</td>
				<td>
					<select class="ui dropdown auto-width" v-model="routeType">
						<option value="default">[默认线路]</option>
						<option value="user">自定义线路</option>
						<optgroup label="---"></optgroup>
						<option value="isp" v-if="supportISPRoutes">运营商</option>
						<option value="china" v-if="supportChinaProvinceRoutes">中国省市</option>
						<option value="world" v-if="supportWorldRegionRoutes">全球国家地区</option>
						<option value="agent" v-if="supportAgentRoutes">搜索引擎</option>
						<optgroup label="---" v-if="publicCategories.length > 0"></optgroup>
						<option v-for="category in publicCategories" :value="category.type">{{category.name}}</option>
					</select>
				</td>
			</tr>
			<tr>
				<td>选择线路 *</td>
				<td>
					<select class="ui dropdown auto-width" v-model="routeCode">
						<option v-for="route in routes" :value="route.code" v-if="route.type == routeType">{{route.name}}</option>
					</select>
				</td>
			</tr>
			<tr v-if="routeCode.length > 0 && provinces[routeCode] != null">
				<td>选择省/州</td>
				<td>
					<select class="ui dropdown auto-width" v-model="provinceRouteCode">
						<option value="">[全域]</option>
						<option v-for="province in provinces[routeCode]" :value="province.code">{{province.name}}</option>
					</select>
				</td>
			</tr>
		</table>
		<div>
			<button type="button" class="ui button tiny" @click.prevent="confirm">确定</button>
			&nbsp; <a href="" title="取消" @click.prevent="cancel">取消</a>
		</div>
	</div>
	<button class="ui button tiny" type="button" @click.prevent="add" v-if="!isAdding">+</button>
	<p class="comment" v-if="!supportISPRoutes || !supportChinaProvinceRoutes || !supportWorldRegionRoutes || !supportPublicRoutes">由于套餐限制，当前用户只能使用部分线路。</p>
</div>`
})

Vue.component("ns-create-records-table", {
	props: ["v-types", "v-default-ttl"],
	data: function () {
		let types = this.vTypes
		if (types == null) {
			types = []
		}

		let defaultTTL = this.vDefaultTtl
		if (defaultTTL != null) {
			defaultTTL = parseInt(defaultTTL.toString())
		}
		if (defaultTTL <= 0) {
			defaultTTL = 600
		}

		return {
			types: types,
			defaultTTL: defaultTTL,
			records: [
				{
					name: "",
					type: "A",
					value: "",
					routeCodes: [],
					ttl: defaultTTL,
					index: 0
				}
			],
			lastIndex: 0,
			isAddingRoutes: false // 是否正在添加线路
		}
	},
	methods: {
		add: function () {
			this.records.push({
				name: "",
				type: "A",
				value: "",
				routeCodes: [],
				ttl: this.defaultTTL,
				index: ++this.lastIndex
			})
			let that = this
			setTimeout(function () {
				that.$refs.nameInputs.$last().focus()
			}, 100)
		},
		remove: function (index) {
			this.records.$remove(index)
		},
		addRoutes: function () {
			this.isAddingRoutes = true
		},
		cancelRoutes: function () {
			let that = this
			setTimeout(function () {
				that.isAddingRoutes = false
			}, 1000)
		},
		changeRoutes: function (record, routes) {
			if (routes == null) {
				record.routeCodes = []
			} else {
				record.routeCodes = routes.map(function (route) {
					return route.code
				})
			}
		}
	},
	template: `<div>
<input type="hidden" name="recordsJSON" :value="JSON.stringify(records)"/>
<table class="ui table selectable celled" style="max-width: 60em">
	<thead class="full-width">
		<tr>
			<th style="width:10em">记录名</th>
			<th style="width:7em">记录类型</th>
			<th>线路</th>
			<th v-if="!isAddingRoutes">记录值</th>
			<th v-if="!isAddingRoutes">TTL</th>
			<th class="one op" v-if="!isAddingRoutes">操作</th>
		</tr>
	</thead>
	<tr v-for="(record, index) in records" :key="record.index">
		<td>
			<input type="text" style="width:10em" v-model="record.name" ref="nameInputs"/>		
		</td>
		<td>
			<select class="ui dropdown auto-width" v-model="record.type">
				<option v-for="type in types" :value="type.type">{{type.type}}</option>
			</select>
		</td>
		<td>
			<ns-routes-selector @add="addRoutes" @cancel="cancelRoutes" @change="changeRoutes(record, $event)"></ns-routes-selector>
		</td>
		<td v-if="!isAddingRoutes">
		  <input type="text" style="width:10em" maxlength="512" v-model="record.value"/>
		</td>
		<td v-if="!isAddingRoutes">
			<div class="ui input right labeled">
				<input type="text" v-model="record.ttl" style="width:5em" maxlength="8"/>
				<span class="ui label">秒</span>
			</div>
		</td>
		<td v-if="!isAddingRoutes">
			<a href="" title="删除" @click.prevent="remove(index)"><i class="icon remove"></i></a>
		</td>
	</tr>
</table>
<button class="ui button tiny" type="button" @click.prevent="add">+</button>
</div>`,
})

Vue.component("ns-route-ranges-box", {
	props: ["v-ranges"],
	data: function () {
		let ranges = this.vRanges
		if (ranges == null) {
			ranges = []
		}
		return {
			ranges: ranges,
			isAdding: false,
			isAddingBatch: false,

			// 类型
			rangeType: "ipRange",
			isReverse: false,

			// IP范围
			ipRangeFrom: "",
			ipRangeTo: "",

			batchIPRange: "",

			// CIDR
			ipCIDR: "",
			batchIPCIDR: "",

			// region
			regions: [],
			regionType: "country",
			regionConnector: "OR"
		}
	},
	methods: {
		addIPRange: function () {
			this.isAdding = true
			let that = this
			setTimeout(function () {
				that.$refs.ipRangeFrom.focus()
			}, 100)
		},
		addCIDR: function () {
			this.isAdding = true
			let that = this
			setTimeout(function () {
				that.$refs.ipCIDR.focus()
			}, 100)
		},
		addRegions: function () {
			this.isAdding = true
		},
		addRegion: function (regionType) {
			this.regionType = regionType
		},
		remove: function (index) {
			this.ranges.$remove(index)
		},
		cancelIPRange: function () {
			this.isAdding = false
			this.ipRangeFrom = ""
			this.ipRangeTo = ""
			this.isReverse = false
		},
		cancelIPCIDR: function () {
			this.isAdding = false
			this.ipCIDR = ""
			this.isReverse = false
		},
		cancelRegions: function () {
			this.isAdding = false
			this.regions = []
			this.regionType = "country"
			this.regionConnector = "OR"
			this.isReverse = false
		},
		confirmIPRange: function () {
			// 校验IP
			let that = this
			this.ipRangeFrom = this.ipRangeFrom.trim()
			if (!this.validateIP(this.ipRangeFrom)) {
				teaweb.warn("开始IP填写错误", function () {
					that.$refs.ipRangeFrom.focus()
				})
				return
			}

			this.ipRangeTo = this.ipRangeTo.trim()
			if (!this.validateIP(this.ipRangeTo)) {
				teaweb.warn("结束IP填写错误", function () {
					that.$refs.ipRangeTo.focus()
				})
				return
			}

			this.ranges.push({
				type: "ipRange",
				params: {
					ipFrom: this.ipRangeFrom,
					ipTo: this.ipRangeTo,
					isReverse: this.isReverse
				}
			})
			this.cancelIPRange()
		},
		confirmIPCIDR: function () {
			let that = this
			if (this.ipCIDR.length == 0) {
				teaweb.warn("请填写CIDR", function () {
					that.$refs.ipCIDR.focus()
				})
				return
			}
			if (!this.validateCIDR(this.ipCIDR)) {
				teaweb.warn("请输入正确的CIDR", function () {
					that.$refs.ipCIDR.focus()
				})
				return
			}


			this.ranges.push({
				type: "cidr",
				params: {
					cidr: this.ipCIDR,
					isReverse: this.isReverse
				}
			})
			this.cancelIPCIDR()
		},
		confirmRegions: function () {
			if (this.regions.length == 0) {
				this.cancelRegions()
				return
			}
			this.ranges.push({
				type: "region",
				connector: this.regionConnector,
				params: {
					regions: this.regions,
					isReverse: this.isReverse
				}
			})
			this.cancelRegions()
		},
		addBatchIPRange: function () {
			this.isAddingBatch = true
			let that = this
			setTimeout(function () {
				that.$refs.batchIPRange.focus()
			}, 100)
		},
		addBatchCIDR: function () {
			this.isAddingBatch = true
			let that = this
			setTimeout(function () {
				that.$refs.batchIPCIDR.focus()
			}, 100)
		},
		cancelBatchIPRange: function () {
			this.isAddingBatch = false
			this.batchIPRange = ""
			this.isReverse = false
		},
		cancelBatchIPCIDR: function () {
			this.isAddingBatch = false
			this.batchIPCIDR = ""
			this.isReverse = false
		},
		confirmBatchIPRange: function () {
			let that = this
			let rangesText = this.batchIPRange
			if (rangesText.length == 0) {
				teaweb.warn("请填写要加入的IP范围", function () {
					that.$refs.batchIPRange.focus()
				})
				return
			}

			let validRanges = []
			let invalidLine = ""
			rangesText.split("\n").forEach(function (line) {
				line = line.trim()
				if (line.length == 0) {
					return
				}
				line = line.replace("，", ",")
				let pieces = line.split(",")
				if (pieces.length != 2) {
					invalidLine = line
					return
				}
				let ipFrom = pieces[0].trim()
				let ipTo = pieces[1].trim()
				if (!that.validateIP(ipFrom) || !that.validateIP(ipTo)) {
					invalidLine = line
					return
				}
				validRanges.push({
					type: "ipRange",
					params: {
						ipFrom: ipFrom,
						ipTo: ipTo,
						isReverse: that.isReverse
					}
				})
			})
			if (invalidLine.length > 0) {
				teaweb.warn("'" + invalidLine + "'格式错误", function () {
					that.$refs.batchIPRange.focus()
				})
				return
			}
			validRanges.forEach(function (v) {
				that.ranges.push(v)
			})
			this.cancelBatchIPRange()
		},
		confirmBatchIPCIDR: function () {
			let that = this
			let rangesText = this.batchIPCIDR
			if (rangesText.length == 0) {
				teaweb.warn("请填写要加入的CIDR", function () {
					that.$refs.batchIPCIDR.focus()
				})
				return
			}

			let validRanges = []
			let invalidLine = ""
			rangesText.split("\n").forEach(function (line) {
				let cidr = line.trim()
				if (cidr.length == 0) {
					return
				}
				if (!that.validateCIDR(cidr)) {
					invalidLine = line
					return
				}
				validRanges.push({
					type: "cidr",
					params: {
						cidr: cidr,
						isReverse: that.isReverse
					}
				})
			})
			if (invalidLine.length > 0) {
				teaweb.warn("'" + invalidLine + "'格式错误", function () {
					that.$refs.batchIPCIDR.focus()
				})
				return
			}
			validRanges.forEach(function (v) {
				that.ranges.push(v)
			})
			this.cancelBatchIPCIDR()
		},
		selectRegionCountry: function (country) {
			if (country == null) {
				return
			}
			this.regions.push({
				type: "country",
				id: country.id,
				name: country.name
			})
			this.$refs.regionCountryComboBox.clear()
		},
		selectRegionProvince: function (province) {
			if (province == null) {
				return
			}
			this.regions.push({
				type: "province",
				id: province.id,
				name: province.name
			})
			this.$refs.regionProvinceComboBox.clear()
		},
		selectRegionCity: function (city) {
			if (city == null) {
				return
			}
			this.regions.push({
				type: "city",
				id: city.id,
				name: city.name
			})
			this.$refs.regionCityComboBox.clear()
		},
		selectRegionProvider: function (provider) {
			if (provider == null) {
				return
			}
			this.regions.push({
				type: "provider",
				id: provider.id,
				name: provider.name
			})
			this.$refs.regionProviderComboBox.clear()
		},
		removeRegion: function (index) {
			this.regions.$remove(index)
		},
		validateIP: function (ip) {
			if (ip.length == 0) {
				return
			}

			// IPv6
			if (ip.indexOf(":") >= 0) {
				let pieces = ip.split(":")
				if (pieces.length > 8) {
					return false
				}
				let isOk = true
				pieces.forEach(function (piece) {
					if (!/^[\da-fA-F]{0,4}$/.test(piece)) {
						isOk = false
					}
				})

				return isOk
			}

			if (!ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)) {
				return false
			}
			let pieces = ip.split(".")
			let isOk = true
			pieces.forEach(function (v) {
				let v1 = parseInt(v)
				if (v1 > 255) {
					isOk = false
				}
			})
			return isOk
		},
		validateCIDR: function (cidr) {
			let pieces = cidr.split("/")
			if (pieces.length != 2) {
				return false
			}
			let ip = pieces[0]
			if (!this.validateIP(ip)) {
				return false
			}
			let mask = pieces[1]
			if (!/^\d{1,3}$/.test(mask)) {
				return false
			}
			mask = parseInt(mask, 10)
			if (cidr.indexOf(":") >= 0) { // IPv6
				return mask <= 128
			}
			return mask <= 32
		},
		updateRangeType: function (rangeType) {
			this.rangeType = rangeType
		}
	},
	template: `<div>
	<input type="hidden" name="rangesJSON" :value="JSON.stringify(ranges)"/>
	<div v-if="ranges.length > 0">
		<div class="ui label tiny basic" v-for="(range, index) in ranges" style="margin-bottom: 0.3em">
			<span class="red" v-if="range.params.isReverse">[排除]</span>
			<span v-if="range.type == 'ipRange'">IP范围：</span>
			<span v-if="range.type == 'cidr'">CIDR：</span>
			<span v-if="range.type == 'region'"></span>
			<span v-if="range.type == 'ipRange'">{{range.params.ipFrom}} - {{range.params.ipTo}}</span>
			<span v-if="range.type == 'cidr'">{{range.params.cidr}}</span>
			<span v-if="range.type == 'region'">
				<span v-for="(region, index) in range.params.regions">
					<span v-if="region.type == 'country'">国家/地区</span>
					<span v-if="region.type == 'province'">省份</span>
					<span v-if="region.type == 'city'">城市</span>
					<span v-if="region.type == 'provider'">ISP</span>
					：{{region.name}}
					<span v-if="index < range.params.regions.length - 1" class="grey">
						&nbsp;
						<span v-if="range.connector == 'OR' || range.connector == '' || range.connector == null">或</span>
						<span v-if="range.connector == 'AND'">且</span>
						&nbsp;
					</span>
				</span>
			</span>
			 &nbsp; <a href="" title="删除" @click.prevent="remove(index)"><i class="icon remove small"></i></a>
		</div>
		<div class="ui divider"></div>
	</div>
	
	<!-- IP范围 -->
	<div v-if="rangeType == 'ipRange'">
		<!-- 添加单个IP范围 -->
		<div style="margin-bottom: 1em" v-show="isAdding">
			<table class="ui table">
				<tr>
					<td class="title">开始IP *</td>
					<td>
						<input type="text" placeholder="开始IP" maxlength="40" size="40" style="width: 15em" v-model="ipRangeFrom" ref="ipRangeFrom"  @keyup.enter="confirmIPRange" @keypress.enter.prevent="1"/>
					</td>
				</tr>
				<tr>
					<td>结束IP *</td>
					<td>
						<input type="text" placeholder="结束IP" maxlength="40" size="40" style="width: 15em" v-model="ipRangeTo" ref="ipRangeTo" @keyup.enter="confirmIPRange" @keypress.enter.prevent="1"/>
					</td>
				</tr>
				<tr>
					<td>排除</td>
					<td>
						<checkbox v-model="isReverse"></checkbox>
						<p class="comment">选中后表示线路中排除当前条件。</p>
					</td>
				</tr>
			</table>
			<button class="ui button tiny" type="button" @click.prevent="confirmIPRange">确定</button> &nbsp;
					<a href="" @click.prevent="cancelIPRange" title="取消"><i class="icon remove small"></i></a>
		</div>
	
		<!-- 添加多个IP范围 -->
		<div style="margin-bottom: 1em" v-show="isAddingBatch">
			<table class="ui table">
				<tr>
					<td class="title">IP范围列表 *</td>
					<td>
						<textarea rows="5" ref="batchIPRange" v-model="batchIPRange"></textarea>	
						<p class="comment">每行一条，格式为<code-label>开始IP,结束IP</code-label>，比如<code-label>192.168.1.100,192.168.1.200</code-label>。</p>	
					</td>
				</tr>
				<tr>
					<td>排除</td>
					<td>
						<checkbox v-model="isReverse"></checkbox>
						<p class="comment">选中后表示线路中排除当前条件。</p>
					</td>
				</tr>
			</table>
			<button class="ui button tiny" type="button" @click.prevent="confirmBatchIPRange">确定</button> &nbsp;
				<a href="" @click.prevent="cancelBatchIPRange" title="取消"><i class="icon remove small"></i></a>
		</div>
		
		<div v-if="!isAdding && !isAddingBatch">
			<button class="ui button tiny" type="button" @click.prevent="addIPRange">添加单个IP范围</button> &nbsp;
			<button class="ui button tiny" type="button" @click.prevent="addBatchIPRange">批量添加IP范围</button>
		</div>
	</div>
	
	<!-- CIDR -->
	<div v-if="rangeType == 'cidr'">
		<!-- 添加单个IP范围 -->
		<div style="margin-bottom: 1em" v-show="isAdding">
			<table class="ui table">
				<tr>
					<td class="title">CIDR *</td>
					<td>
						<input type="text" placeholder="IP/MASK" maxlength="40" size="40" style="width: 15em" v-model="ipCIDR" ref="ipCIDR"  @keyup.enter="confirmIPCIDR" @keypress.enter.prevent="1"/>
						<p class="comment">类似于<code-label>192.168.2.1/24</code-label>。</p>
					</td>
				</tr>
				<tr>
					<td>排除</td>
					<td>
						<checkbox v-model="isReverse"></checkbox>
						<p class="comment">选中后表示线路中排除当前条件。</p>
					</td>
				</tr>
			</table>
			<button class="ui button tiny" type="button" @click.prevent="confirmIPCIDR">确定</button> &nbsp;
					<a href="" @click.prevent="cancelIPCIDR" title="取消"><i class="icon remove small"></i></a>
		</div>
		
		<!-- 添加多个IP范围 -->
		<div style="margin-bottom: 1em" v-show="isAddingBatch">
			<table class="ui table">
				<tr>
					<td class="title">IP范围列表 *</td>
					<td>
						<textarea rows="5" ref="batchIPCIDR" v-model="batchIPCIDR"></textarea>	
						<p class="comment">每行一条，格式为<code-label>IP/MASK</code-label>，比如<code-label>192.168.2.1/24</code-label>。</p>	
					</td>
				</tr>
				<tr>
					<td>排除</td>
					<td>
						<checkbox v-model="isReverse"></checkbox>
						<p class="comment">选中后表示线路中排除当前条件。</p>
					</td>
				</tr>
			</table>
			<button class="ui button tiny" type="button" @click.prevent="confirmBatchIPCIDR">确定</button> &nbsp;
				<a href="" @click.prevent="cancelBatchIPCIDR" title="取消"><i class="icon remove small"></i></a>
		</div>
		
		<div v-if="!isAdding && !isAddingBatch">
			<button class="ui button tiny" type="button" @click.prevent="addCIDR">添加单个CIDR</button> &nbsp;
			<button class="ui button tiny" type="button" @click.prevent="addBatchCIDR">批量添加CIDR</button>
		</div>
	</div>
	
	<!-- 区域 -->
	<div v-if="rangeType == 'region'">
		<!-- 添加区域 -->
		<div v-if="isAdding">
			<table class="ui table">
				<tr>
					<td>已添加</td>
					<td>
						<span v-for="(region, index) in regions">
							<span class="ui label small basic">
								<span v-if="region.type == 'country'">国家/地区</span>
								<span v-if="region.type == 'province'">省份</span>
								<span v-if="region.type == 'city'">城市</span>
								<span v-if="region.type == 'provider'">ISP</span>
								：{{region.name}} <a href="" title="删除" @click.prevent="removeRegion(index)"><i class="icon remove small"></i></a>
							</span>
							<span v-if="index < regions.length - 1" class="grey">
								&nbsp;
								<span v-if="regionConnector == 'OR' || regionConnector == ''">或</span>
								<span v-if="regionConnector == 'AND'">且</span>
								&nbsp;
							</span>
						</span>
					</td>
				</tr>
				<tr>
					<td class="title">添加新<span v-if="regionType == 'country'">国家/地区</span><span v-if="regionType == 'province'">省份</span><span v-if="regionType == 'city'">城市</span><span v-if="regionType == 'provider'">ISP</span>
					
					 *</td>
					<td>
					 	<!-- region country name -->
						<div v-if="regionType == 'country'">
							<combo-box title="" width="14em" data-url="/ui/countryOptions" data-key="countries" placeholder="点这里选择国家/地区" @change="selectRegionCountry" ref="regionCountryComboBox" key="combo-box-country"></combo-box>
						</div>
			
						<!-- region province name -->
						<div v-if="regionType == 'province'" >
							<combo-box title="" data-url="/ui/provinceOptions" data-key="provinces" placeholder="点这里选择省份" @change="selectRegionProvince" ref="regionProvinceComboBox" key="combo-box-province"></combo-box>
						</div>
			
						<!-- region city name -->
						<div v-if="regionType == 'city'" >
							<combo-box title="" data-url="/ui/cityOptions" data-key="cities" placeholder="点这里选择城市" @change="selectRegionCity" ref="regionCityComboBox" key="combo-box-city"></combo-box>
						</div>
			
						<!-- ISP Name -->
						<div v-if="regionType == 'provider'" >
							<combo-box title="" data-url="/ui/providerOptions" data-key="providers" placeholder="点这里选择ISP" @change="selectRegionProvider" ref="regionProviderComboBox" key="combo-box-isp"></combo-box>
						</div>
						
						<div style="margin-top: 1em">
							<button class="ui button tiny basic" :class="{blue: regionType == 'country'}" type="button" @click.prevent="addRegion('country')">添加国家/地区</button> &nbsp;
							<button class="ui button tiny basic" :class="{blue: regionType == 'province'}" type="button" @click.prevent="addRegion('province')">添加省份</button> &nbsp;
							<button class="ui button tiny basic" :class="{blue: regionType == 'city'}" type="button" @click.prevent="addRegion('city')">添加城市</button> &nbsp;
							<button class="ui button tiny basic" :class="{blue: regionType == 'provider'}" type="button" @click.prevent="addRegion('provider')">ISP</button> &nbsp;
						</div>
					</td>	
				</tr>
				<tr>
					<td>区域之间关系</td>
					<td>
						<select class="ui dropdown auto-width" v-model="regionConnector">
							<option value="OR">或</option>
							<option value="AND">且</option>
						</select>
						<p class="comment" v-if="regionConnector == 'OR'">匹配所选任一区域即认为匹配成功。</p>
						<p class="comment" v-if="regionConnector == 'AND'">匹配所有所选区域才认为匹配成功。</p>
					</td>
				</tr>
				<tr>
					<td>排除</td>
					<td>
						<checkbox v-model="isReverse"></checkbox>
						<p class="comment">选中后表示线路中排除当前条件。</p>
					</td>
				</tr>
			</table>
			<button class="ui button tiny" type="button" @click.prevent="confirmRegions">确定</button> &nbsp;
				<a href="" @click.prevent="cancelRegions" title="取消"><i class="icon remove small"></i></a>
		</div>
		<div v-if="!isAdding && !isAddingBatch">
			<button class="ui button tiny" type="button" @click.prevent="addRegions">添加区域</button> &nbsp;
		</div>	
	</div>
</div>`
})

Vue.component("ns-access-log-box", {
	props: ["v-access-log", "v-keyword"],
	data: function () {
		let accessLog = this.vAccessLog
		return {
			accessLog: accessLog
		}
	},
	methods: {
		showLog: function () {
			let that = this
			let requestId = this.accessLog.requestId
			this.$parent.$children.forEach(function (v) {
				if (v.deselect != null) {
					v.deselect()
				}
			})
			this.select()

			teaweb.popup("/ns/clusters/accessLogs/viewPopup?requestId=" + requestId, {
				width: "50em",
				height: "24em",
				onClose: function () {
					that.deselect()
				}
			})
		},
		select: function () {
			this.$refs.box.parentNode.style.cssText = "background: rgba(0, 0, 0, 0.1)"
		},
		deselect: function () {
			this.$refs.box.parentNode.style.cssText = ""
		}
	},
	template: `<div class="access-log-row" :style="{'color': (!accessLog.isRecursive && (accessLog.nsRecordId == null || accessLog.nsRecordId == 0) || (accessLog.isRecursive && accessLog.recordValue != null && accessLog.recordValue.length == 0)) ? '#dc143c' : ''}" ref="box">
	<span v-if="accessLog.region != null && accessLog.region.length > 0" class="grey">[{{accessLog.region}}]</span> <keyword :v-word="vKeyword">{{accessLog.remoteAddr}}</keyword> [{{accessLog.timeLocal}}] [{{accessLog.networking}}] <em>{{accessLog.questionType}} <keyword :v-word="vKeyword">{{accessLog.questionName}}</keyword></em> -&gt; 
	
	<span v-if="accessLog.recordType != null && accessLog.recordType.length > 0"><em>{{accessLog.recordType}} <keyword :v-word="vKeyword">{{accessLog.recordValue}}</keyword></em></span>
	<span v-else class="disabled">&nbsp;[没有记录]</span>
	
	<!-- &nbsp; <a href="" @click.prevent="showLog" title="查看详情"><i class="icon expand"></i></a>-->
	<div v-if="(accessLog.nsRoutes != null && accessLog.nsRoutes.length > 0) || accessLog.isRecursive" style="margin-top: 0.3em">
		<span class="ui label tiny basic grey" v-for="route in accessLog.nsRoutes">线路: {{route.name}}</span>
		<span class="ui label tiny basic grey" v-if="accessLog.isRecursive">递归DNS</span>
	</div>
	<div v-if="accessLog.error != null && accessLog.error.length > 0" style="color:#dc143c">
		<i class="icon warning circle"></i>错误：[{{accessLog.error}}]
	</div>
</div>`
})

window.REQUEST_COND_COMPONENTS = [{"type":"url-extension","name":"文件扩展名","description":"根据URL中的文件路径扩展名进行过滤","component":"http-cond-url-extension","paramsTitle":"扩展名列表","isRequest":true,"caseInsensitive":false},{"type":"url-eq-index","name":"首页","description":"检查URL路径是为\"/\"","component":"http-cond-url-eq-index","paramsTitle":"URL完整路径","isRequest":true,"caseInsensitive":false},{"type":"url-all","name":"全站","description":"全站所有URL","component":"http-cond-url-all","paramsTitle":"URL完整路径","isRequest":true,"caseInsensitive":false},{"type":"url-prefix","name":"URL目录前缀","description":"根据URL中的文件路径前缀进行过滤","component":"http-cond-url-prefix","paramsTitle":"URL目录前缀","isRequest":true,"caseInsensitive":true},{"type":"url-eq","name":"URL完整路径","description":"检查URL中的文件路径是否一致","component":"http-cond-url-eq","paramsTitle":"URL完整路径","isRequest":true,"caseInsensitive":true},{"type":"url-regexp","name":"URL正则匹配","description":"使用正则表达式检查URL中的文件路径是否一致","component":"http-cond-url-regexp","paramsTitle":"正则表达式","isRequest":true,"caseInsensitive":true},{"type":"url-wildcard-match","name":"URL通配符","description":"使用通配符检查URL中的文件路径是否一致","component":"http-cond-url-wildcard-match","paramsTitle":"通配符","isRequest":true,"caseInsensitive":true},{"type":"user-agent-regexp","name":"User-Agent正则匹配","description":"使用正则表达式检查User-Agent中是否含有某些浏览器和系统标识","component":"http-cond-user-agent-regexp","paramsTitle":"正则表达式","isRequest":true,"caseInsensitive":true},{"type":"params","name":"参数匹配","description":"根据参数值进行匹配","component":"http-cond-params","paramsTitle":"参数配置","isRequest":true,"caseInsensitive":false},{"type":"url-not-extension","name":"排除：URL扩展名","description":"根据URL中的文件路径扩展名进行过滤","component":"http-cond-url-not-extension","paramsTitle":"扩展名列表","isRequest":true,"caseInsensitive":false},{"type":"url-not-prefix","name":"排除：URL前缀","description":"根据URL中的文件路径前缀进行过滤","component":"http-cond-url-not-prefix","paramsTitle":"URL前缀","isRequest":true,"caseInsensitive":true},{"type":"url-not-eq","name":"排除：URL完整路径","description":"检查URL中的文件路径是否一致","component":"http-cond-url-not-eq","paramsTitle":"URL完整路径","isRequest":true,"caseInsensitive":true},{"type":"url-not-regexp","name":"排除：URL正则匹配","description":"使用正则表达式检查URL中的文件路径是否一致，如果一致，则不匹配","component":"http-cond-url-not-regexp","paramsTitle":"正则表达式","isRequest":true,"caseInsensitive":true},{"type":"user-agent-not-regexp","name":"排除：User-Agent正则匹配","description":"使用正则表达式检查User-Agent中是否含有某些浏览器和系统标识，如果含有，则不匹配","component":"http-cond-user-agent-not-regexp","paramsTitle":"正则表达式","isRequest":true,"caseInsensitive":true},{"type":"mime-type","name":"内容MimeType","description":"根据服务器返回的内容的MimeType进行过滤。注意：当用于缓存条件时，此条件需要结合别的请求条件使用。","component":"http-cond-mime-type","paramsTitle":"MimeType列表","isRequest":false,"caseInsensitive":false}];

window.REQUEST_COND_OPERATORS = [{"description":"判断是否正则表达式匹配","name":"正则表达式匹配","op":"regexp"},{"description":"判断是否正则表达式不匹配","name":"正则表达式不匹配","op":"not regexp"},{"description":"判断是否和指定的通配符匹配","name":"通配符匹配","op":"wildcard match"},{"description":"判断是否和指定的通配符不匹配","name":"通配符不匹配","op":"wildcard not match"},{"description":"使用字符串对比参数值是否相等于某个值","name":"字符串等于","op":"eq"},{"description":"参数值包含某个前缀","name":"字符串前缀","op":"prefix"},{"description":"参数值包含某个后缀","name":"字符串后缀","op":"suffix"},{"description":"参数值包含另外一个字符串","name":"字符串包含","op":"contains"},{"description":"参数值不包含另外一个字符串","name":"字符串不包含","op":"not contains"},{"description":"使用字符串对比参数值是否不相等于某个值","name":"字符串不等于","op":"not"},{"description":"判断参数值在某个列表中","name":"在列表中","op":"in"},{"description":"判断参数值不在某个列表中","name":"不在列表中","op":"not in"},{"description":"判断小写的扩展名（不带点）在某个列表中","name":"扩展名","op":"file ext"},{"description":"判断MimeType在某个列表中，支持类似于image/*的语法","name":"MimeType","op":"mime type"},{"description":"判断版本号在某个范围内，格式为version1,version2","name":"版本号范围","op":"version range"},{"description":"将参数转换为整数数字后进行对比","name":"整数等于","op":"eq int"},{"description":"将参数转换为可以有小数的浮点数字进行对比","name":"浮点数等于","op":"eq float"},{"description":"将参数转换为数字进行对比","name":"数字大于","op":"gt"},{"description":"将参数转换为数字进行对比","name":"数字大于等于","op":"gte"},{"description":"将参数转换为数字进行对比","name":"数字小于","op":"lt"},{"description":"将参数转换为数字进行对比","name":"数字小于等于","op":"lte"},{"description":"对整数参数值取模，除数为10，对比值为余数","name":"整数取模10","op":"mod 10"},{"description":"对整数参数值取模，除数为100，对比值为余数","name":"整数取模100","op":"mod 100"},{"description":"对整数参数值取模，对比值格式为：除数,余数，比如10,1","name":"整数取模","op":"mod"},{"description":"将参数转换为IP进行对比","name":"IP等于","op":"eq ip"},{"description":"将参数转换为IP进行对比","name":"IP大于","op":"gt ip"},{"description":"将参数转换为IP进行对比","name":"IP大于等于","op":"gte ip"},{"description":"将参数转换为IP进行对比","name":"IP小于","op":"lt ip"},{"description":"将参数转换为IP进行对比","name":"IP小于等于","op":"lte ip"},{"description":"IP在某个范围之内，范围格式可以是英文逗号分隔的\u003ccode-label\u003e开始IP,结束IP\u003c/code-label\u003e，比如\u003ccode-label\u003e192.168.1.100,192.168.2.200\u003c/code-label\u003e，或者CIDR格式的ip/bits，比如\u003ccode-label\u003e192.168.2.1/24\u003c/code-label\u003e","name":"IP范围","op":"ip range"},{"description":"对IP参数值取模，除数为10，对比值为余数","name":"IP取模10","op":"ip mod 10"},{"description":"对IP参数值取模，除数为100，对比值为余数","name":"IP取模100","op":"ip mod 100"},{"description":"对IP参数值取模，对比值格式为：除数,余数，比如10,1","name":"IP取模","op":"ip mod"}];

window.REQUEST_VARIABLES = [{"code":"${edgeVersion}","description":"","name":"边缘节点版本"},{"code":"${remoteAddr}","description":"会依次根据X-Forwarded-For、X-Real-IP、RemoteAddr获取，适合前端有别的反向代理服务时使用，存在伪造的风险","name":"客户端地址（IP）"},{"code":"${rawRemoteAddr}","description":"返回直接连接服务的客户端原始IP地址","name":"客户端地址（IP）"},{"code":"${remotePort}","description":"","name":"客户端端口"},{"code":"${remoteUser}","description":"","name":"客户端用户名"},{"code":"${requestURI}","description":"比如/hello?name=lily","name":"请求URI"},{"code":"${requestPath}","description":"比如/hello","name":"请求路径（不包括参数）"},{"code":"${requestURL}","description":"比如https://example.com/hello?name=lily","name":"完整的请求URL"},{"code":"${requestLength}","description":"","name":"请求内容长度"},{"code":"${requestMethod}","description":"比如GET、POST","name":"请求方法"},{"code":"${requestFilename}","description":"","name":"请求文件路径"},{"code":"${requestPathExtension}","description":"请求路径中的文件扩展名，包括点符号，比如.html、.png","name":"请求文件扩展名"},{"code":"${requestPathLowerExtension}","description":"请求路径中的文件扩展名，其中大写字母会被自动转换为小写，包括点符号，比如.html、.png","name":"请求文件小写扩展名"},{"code":"${scheme}","description":"","name":"请求协议，http或https"},{"code":"${proto}","description:":"类似于HTTP/1.0","name":"包含版本的HTTP请求协议"},{"code":"${timeISO8601}","description":"比如2018-07-16T23:52:24.839+08:00","name":"ISO 8601格式的时间"},{"code":"${timeLocal}","description":"比如17/Jul/2018:09:52:24 +0800","name":"本地时间"},{"code":"${msec}","description":"比如1531756823.054","name":"带有毫秒的时间"},{"code":"${timestamp}","description":"","name":"unix时间戳，单位为秒"},{"code":"${host}","description":"","name":"主机名"},{"code":"${cname}","description":"比如38b48e4f.goedge.cloud","name":"当前网站的CNAME"},{"code":"${serverName}","description":"","name":"接收请求的服务器名"},{"code":"${serverPort}","description":"","name":"接收请求的服务器端口"},{"code":"${referer}","description":"","name":"请求来源URL"},{"code":"${referer.host}","description":"","name":"请求来源URL域名"},{"code":"${userAgent}","description":"","name":"客户端信息"},{"code":"${contentType}","description":"","name":"请求头部的Content-Type"},{"code":"${cookies}","description":"","name":"所有cookie组合字符串"},{"code":"${cookie.NAME}","description":"","name":"单个cookie值"},{"code":"${isArgs}","description":"如果URL有参数，则值为`?`；否则，则值为空","name":"问号（?）标记"},{"code":"${args}","description":"","name":"所有参数组合字符串"},{"code":"${arg.NAME}","description":"","name":"单个参数值"},{"code":"${headers}","description":"","name":"所有Header信息组合字符串"},{"code":"${header.NAME}","description":"","name":"单个Header值"},{"code":"${geo.country.name}","description":"","name":"国家/地区名称"},{"code":"${geo.country.id}","description":"","name":"国家/地区ID"},{"code":"${geo.province.name}","description":"目前只包含中国省份","name":"省份名称"},{"code":"${geo.province.id}","description":"目前只包含中国省份","name":"省份ID"},{"code":"${geo.city.name}","description":"目前只包含中国城市","name":"城市名称"},{"code":"${geo.city.id}","description":"目前只包含中国城市","name":"城市名称"},{"code":"${isp.name}","description":"","name":"ISP服务商名称"},{"code":"${isp.id}","description":"","name":"ISP服务商ID"},{"code":"${browser.os.name}","description":"客户端所在操作系统名称","name":"操作系统名称"},{"code":"${browser.os.version}","description":"客户端所在操作系统版本","name":"操作系统版本"},{"code":"${browser.name}","description":"客户端浏览器名称","name":"浏览器名称"},{"code":"${browser.version}","description":"客户端浏览器版本","name":"浏览器版本"},{"code":"${browser.isMobile}","description":"如果客户端是手机，则值为1，否则为0","name":"手机标识"}];

window.METRIC_HTTP_KEYS = [{"name":"客户端地址（IP）","code":"${remoteAddr}","description":"会依次根据X-Forwarded-For、X-Real-IP、RemoteAddr获取，适用于前端可能有别的反向代理的情形，存在被伪造的可能","icon":""},{"name":"直接客户端地址（IP）","code":"${rawRemoteAddr}","description":"返回直接连接服务的客户端原始IP地址","icon":""},{"name":"客户端用户名","code":"${remoteUser}","description":"通过基本认证填入的用户名","icon":""},{"name":"请求URI","code":"${requestURI}","description":"包含参数，比如/hello?name=lily","icon":""},{"name":"请求路径","code":"${requestPath}","description":"不包含参数，比如/hello","icon":""},{"name":"完整URL","code":"${requestURL}","description":"比如https://example.com/hello?name=lily","icon":""},{"name":"请求方法","code":"${requestMethod}","description":"比如GET、POST等","icon":""},{"name":"请求协议Scheme","code":"${scheme}","description":"http或https","icon":""},{"name":"文件扩展名","code":"${requestPathExtension}","description":"请求路径中的文件扩展名，包括点符号，比如.html、.png","icon":""},{"name":"小写文件扩展名","code":"${requestPathLowerExtension}","description":"请求路径中的文件扩展名小写形式，包括点符号，比如.html、.png","icon":""},{"name":"主机名","code":"${host}","description":"通常是请求的域名","icon":""},{"name":"HTTP协议","code":"${proto}","description":"包含版本的HTTP请求协议，类似于HTTP/1.0","icon":""},{"name":"URL参数值","code":"${arg.NAME}","description":"单个URL参数值","icon":""},{"name":"请求来源URL","code":"${referer}","description":"请求来源Referer URL","icon":""},{"name":"请求来源URL域名","code":"${referer.host}","description":"请求来源Referer URL域名","icon":""},{"name":"Header值","code":"${header.NAME}","description":"单个Header值，比如${header.User-Agent}","icon":""},{"name":"Cookie值","code":"${cookie.NAME}","description":"单个cookie值，比如${cookie.sid}","icon":""},{"name":"状态码","code":"${status}","description":"","icon":""},{"name":"响应的Content-Type值","code":"${response.contentType}","description":"","icon":""}];

window.WAF_RULE_CHECKPOINTS = [{"description":"通用报头比如Cache-Control、Accept之类的长度限制，防止缓冲区溢出攻击。","name":"通用请求报头长度限制","prefix":"requestGeneralHeaderLength"},{"description":"通用报头比如Cache-Control、Date之类的长度限制，防止缓冲区溢出攻击。","name":"通用响应报头长度限制","prefix":"responseGeneralHeaderLength"},{"description":"试图通过分析X-Forwarded-For等报头获取的客户端地址，比如192.168.1.100，存在伪造的可能。","name":"客户端地址（IP）","prefix":"remoteAddr"},{"description":"直接连接的客户端地址，比如192.168.1.100。","name":"客户端源地址（IP）","prefix":"rawRemoteAddr"},{"description":"直接连接的客户端地址端口。","name":"客户端端口","prefix":"remotePort"},{"description":"通过BasicAuth登录的客户端用户名。","name":"客户端用户名","prefix":"remoteUser"},{"description":"包含URL参数的请求URI，类似于 /hello/world?lang=go，不包含域名部分。","name":"请求URI","prefix":"requestURI"},{"description":"不包含URL参数的请求路径，类似于 /hello/world，不包含域名部分。","name":"请求路径","prefix":"requestPath"},{"description":"完整的请求URL，包含协议、域名、请求路径、参数等，类似于 https://example.com/hello?name=lily 。","name":"请求完整URL","prefix":"requestURL"},{"description":"请求报头中的Content-Length。","name":"请求内容长度","prefix":"requestLength"},{"description":"通常在POST或者PUT等操作时会附带请求体，最大限制32M。","name":"请求体内容","prefix":"requestBody"},{"description":"${requestURI}和${requestBody}组合。","name":"请求URI和请求体组合","prefix":"requestAll"},{"description":"获取POST或者其他方法发送的表单参数，最大请求体限制32M。","name":"请求表单参数","prefix":"requestForm"},{"description":"获取POST上传的文件信息，最大请求体限制32M。","name":"上传文件","prefix":"requestUpload"},{"description":"获取POST或者其他方法发送的JSON，最大请求体限制32M，使用点（.）符号表示多级数据。","name":"请求JSON参数","prefix":"requestJSON"},{"description":"比如GET、POST。","name":"请求方法","prefix":"requestMethod"},{"description":"比如http或https。","name":"请求协议","prefix":"scheme"},{"description":"比如HTTP/1.1。","name":"HTTP协议版本","prefix":"proto"},{"description":"比如example.com。","name":"主机名","prefix":"host"},{"description":"当前网站服务CNAME，比如38b48e4f.example.com。","name":"CNAME","prefix":"cname"},{"description":"是否为CNAME，值为1（是）或0（否）。","name":"是否为CNAME","prefix":"isCNAME"},{"description":"请求报头中的Referer和Origin值。","name":"请求来源","prefix":"refererOrigin"},{"description":"请求报头中的Referer值。","name":"请求来源Referer","prefix":"referer"},{"description":"比如Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103。","name":"客户端信息","prefix":"userAgent"},{"description":"请求报头的Content-Type。","name":"内容类型","prefix":"contentType"},{"description":"比如sid=IxZVPFhE\u0026city=beijing\u0026uid=18237。","name":"所有cookie组合字符串","prefix":"cookies"},{"description":"单个cookie值。","name":"单个cookie值","prefix":"cookie"},{"description":"比如name=lu\u0026age=20。","name":"所有URL参数组合","prefix":"args"},{"description":"单个URL参数值。","name":"单个URL参数值","prefix":"arg"},{"description":"使用换行符（\\n）隔开的报头内容字符串，每行均为\"NAME: VALUE格式\"。","name":"所有请求报头内容","prefix":"headers"},{"description":"使用换行符（\\n）隔开的报头名称字符串，每行一个名称。","name":"所有请求报头名称","prefix":"headerNames"},{"description":"单个报头值。","name":"单个请求报头值","prefix":"header"},{"description":"最长的请求报头的长度。","name":"请求报头最大长度","prefix":"headerMaxLength"},{"description":"当前客户端所处国家/地区名称。","name":"国家/地区名称","prefix":"geoCountryName"},{"description":"当前客户端所处中国省份名称。","name":"省份名称","prefix":"geoProvinceName"},{"description":"当前客户端所处中国城市名称。","name":"城市名称","prefix":"geoCityName"},{"description":"当前客户端所处ISP名称。","name":"ISP名称","prefix":"ispName"},{"description":"对统计对象进行统计。","name":"CC统计","prefix":"cc2"},{"description":"对统计对象进行统计。","name":"防盗链","prefix":"refererBlock"},{"description":"统计某段时间段内的请求信息（不推荐再使用，请使用新的CC2统计代替）。","name":"CC统计（旧）","prefix":"cc"},{"description":"响应状态码，比如200、404、500。","name":"响应状态码","prefix":"status"},{"description":"响应报头值。","name":"响应报头","prefix":"responseHeader"},{"description":"响应内容字符串。","name":"响应内容","prefix":"responseBody"},{"description":"响应内容长度，通过响应的报头Content-Length获取。","name":"响应内容长度","prefix":"bytesSent"}];

window.WAF_RULE_OPERATORS = [{"name":"正则匹配","code":"match","description":"使用正则表达式匹配，在头部使用(?i)表示不区分大小写，\u003ca href=\"https://goedge.cloud/docs/Appendix/Regexp/Index.md\" target=\"_blank\"\u003e正则表达式语法 \u0026raquo;\u003c/a\u003e。","caseInsensitive":"yes","dataType":"regexp"},{"name":"正则不匹配","code":"not match","description":"使用正则表达式不匹配，在头部使用(?i)表示不区分大小写，\u003ca href=\"https://goedge.cloud/docs/Appendix/Regexp/Index.md\" target=\"_blank\"\u003e正则表达式语法 \u0026raquo;\u003c/a\u003e。","caseInsensitive":"yes","dataType":"regexp"},{"name":"通配符匹配","code":"wildcard match","description":"判断是否和指定的通配符匹配，可以在对比值中使用星号通配符（*）表示任意字符。","caseInsensitive":"yes","dataType":"wildcard"},{"name":"通配符不匹配","code":"wildcard not match","description":"判断是否和指定的通配符不匹配，可以在对比值中使用星号通配符（*）表示任意字符。","caseInsensitive":"yes","dataType":"wildcard"},{"name":"字符串等于","code":"eq string","description":"使用字符串对比等于。","caseInsensitive":"no","dataType":"string"},{"name":"字符串不等于","code":"neq string","description":"使用字符串对比不等于。","caseInsensitive":"no","dataType":"string"},{"name":"包含字符串","code":"contains","description":"包含某个字符串，比如Hello World包含了World。","caseInsensitive":"no","dataType":"string"},{"name":"不包含字符串","code":"not contains","description":"不包含某个字符串，比如Hello字符串中不包含Hi。","caseInsensitive":"no","dataType":"string"},{"name":"包含任一字符串","code":"contains any","description":"包含字符串列表中的任意一个，比如/hello/world包含/hello和/hi中的/hello，对比值中每行一个字符串。","caseInsensitive":"no","dataType":"strings"},{"name":"包含所有字符串","code":"contains all","description":"包含字符串列表中的所有字符串，比如/hello/world必须包含/hello和/world，对比值中每行一个字符串。","caseInsensitive":"no","dataType":"strings"},{"name":"包含前缀","code":"prefix","description":"包含字符串前缀部分，比如/hello前缀会匹配/hello, /hello/world等。","caseInsensitive":"no","dataType":"string"},{"name":"包含后缀","code":"suffix","description":"包含字符串后缀部分，比如/hello后缀会匹配/hello, /hi/hello等。","caseInsensitive":"no","dataType":"string"},{"name":"包含任一单词","code":"contains any word","description":"包含某个独立单词，对比值中每行一个单词，比如mozilla firefox里包含了mozilla和firefox两个单词，但是不包含fire和fox这两个单词。","caseInsensitive":"no","dataType":"strings"},{"name":"包含所有单词","code":"contains all words","description":"包含所有的独立单词，对比值中每行一个单词，比如mozilla firefox里包含了mozilla和firefox两个单词，但是不包含fire和fox这两个单词。","caseInsensitive":"no","dataType":"strings"},{"name":"不包含任一单词","code":"not contains any word","description":"不包含某个独立单词，对比值中每行一个单词，比如mozilla firefox里包含了mozilla和firefox两个单词，但是不包含fire和fox这两个单词。","caseInsensitive":"no","dataType":"strings"},{"name":"包含SQL注入","code":"contains sql injection","description":"检测字符串内容是否包含SQL注入。","caseInsensitive":"none","dataType":"none"},{"name":"包含SQL注入-严格模式","code":"contains sql injection strictly","description":"更加严格地检测字符串内容是否包含SQL注入，相对于非严格模式，有一定的误报几率。","caseInsensitive":"none","dataType":"none"},{"name":"包含XSS注入","code":"contains xss","description":"检测字符串内容是否包含XSS注入。","caseInsensitive":"none","dataType":"none"},{"name":"包含XSS注入-严格模式","code":"contains xss strictly","description":"更加严格地检测字符串内容是否包含XSS注入，相对于非严格模式，此时xml、audio、video等标签也会被匹配。","caseInsensitive":"none","dataType":"none"},{"name":"包含二进制数据","code":"contains binary","description":"包含一组二进制数据。","caseInsensitive":"no","dataType":"string"},{"name":"不包含二进制数据","code":"not contains binary","description":"不包含一组二进制数据。","caseInsensitive":"no","dataType":"string"},{"name":"数值大于","code":"gt","description":"使用数值对比大于，对比值需要是一个数字。","caseInsensitive":"none","dataType":"number"},{"name":"数值大于等于","code":"gte","description":"使用数值对比大于等于，对比值需要是一个数字。","caseInsensitive":"none","dataType":"number"},{"name":"数值小于","code":"lt","description":"使用数值对比小于，对比值需要是一个数字。","caseInsensitive":"none","dataType":"number"},{"name":"数值小于等于","code":"lte","description":"使用数值对比小于等于，对比值需要是一个数字。","caseInsensitive":"none","dataType":"number"},{"name":"数值等于","code":"eq","description":"使用数值对比等于，对比值需要是一个数字。","caseInsensitive":"none","dataType":"number"},{"name":"数值不等于","code":"neq","description":"使用数值对比不等于，对比值需要是一个数字。","caseInsensitive":"none","dataType":"number"},{"name":"包含索引","code":"has key","description":"对于一组数据拥有某个键值或者索引。","caseInsensitive":"no","dataType":"string|number"},{"name":"版本号大于","code":"version gt","description":"对比版本号大于。","caseInsensitive":"none","dataType":"version"},{"name":"版本号小于","code":"version lt","description":"对比版本号小于。","caseInsensitive":"none","dataType":"version"},{"name":"版本号范围","code":"version range","description":"判断版本号在某个范围内，格式为 起始version1,结束version2。","caseInsensitive":"none","dataType":"versionRange"},{"name":"IP等于","code":"eq ip","description":"将参数转换为IP进行对比，只能对比单个IP。","caseInsensitive":"none","dataType":"ip"},{"name":"在一组IP中","code":"in ip list","description":"判断参数IP在一组IP内，对比值中每行一个IP。","caseInsensitive":"none","dataType":"ips"},{"name":"IP大于","code":"gt ip","description":"将参数转换为IP进行对比。","caseInsensitive":"none","dataType":"ip"},{"name":"IP大于等于","code":"gte ip","description":"将参数转换为IP进行对比。","caseInsensitive":"none","dataType":"ip"},{"name":"IP小于","code":"lt ip","description":"将参数转换为IP进行对比。","caseInsensitive":"none","dataType":"ip"},{"name":"IP小于等于","code":"lte ip","description":"将参数转换为IP进行对比。","caseInsensitive":"none","dataType":"ip"},{"name":"IP范围","code":"ip range","description":"IP在某个范围之内，范围格式可以是英文逗号分隔的\u003ccode-label\u003e开始IP,结束IP\u003c/code-label\u003e，比如\u003ccode-label\u003e192.168.1.100,192.168.2.200\u003c/code-label\u003e；或者CIDR格式的ip/bits，比如\u003ccode-label\u003e192.168.2.1/24\u003c/code-label\u003e；或者单个IP。可以填写多行，每行一个IP范围。","caseInsensitive":"none","dataType":"ips"},{"name":"不在IP范围","code":"not ip range","description":"IP不在某个范围之内，范围格式可以是英文逗号分隔的\u003ccode-label\u003e开始IP,结束IP\u003c/code-label\u003e，比如\u003ccode-label\u003e192.168.1.100,192.168.2.200\u003c/code-label\u003e；或者CIDR格式的ip/bits，比如\u003ccode-label\u003e192.168.2.1/24\u003c/code-label\u003e；或者单个IP。可以填写多行，每行一个IP范围。","caseInsensitive":"none","dataType":"ips"},{"name":"IP取模10","code":"ip mod 10","description":"对IP参数值取模，除数为10，对比值为余数。","caseInsensitive":"none","dataType":"number"},{"name":"IP取模100","code":"ip mod 100","description":"对IP参数值取模，除数为100，对比值为余数。","caseInsensitive":"none","dataType":"number"},{"name":"IP取模","code":"ip mod","description":"对IP参数值取模，对比值格式为：除数,余数，比如10,1。","caseInsensitive":"none","dataType":"number"}];

window.WAF_CAPTCHA_TYPES = [{"name":"验证码","code":"default","description":"通过输入验证码来验证人机。","icon":""},{"name":"点击验证","code":"oneClick","description":"通过点击界面元素来验证人机。","icon":""},{"name":"滑动解锁","code":"slide","description":"通过滑动方块解锁来验证人机。","icon":""},{"name":"极验-行为验","code":"geetest","description":"使用极验-行为验提供的人机验证方式。","icon":""}];

