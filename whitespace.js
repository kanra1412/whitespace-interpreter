'use strict'

var fs = require('fs');

var f_path = 'test/http _compsoc.dur.ac.uk_whitespace_count.ws',
	f_path2 = 'test/helloworld.ws',
	f_path3 = 'test/count.ws';

fs.readFile(f_path, (err, data) => {
	if(err) {
		throw new Error(err);
	}
	let str = convers(data);
	console.log('[ source ]:', str,'\n[ length ]:',str.length);

	// str = 'ssstntntsssstsntntssssttntntsssstssntntsssststntntsssststntttssstssntttsssttntttssstsntttssstnttttnsstnsstnsstnsstnssnnn';
	// var input = '12345\n';
	new interpreter(str);
});

function interpreter(str, input) {console.log(this);
	this.stack = [],
	this.heap = {},
	this.op_list = [],
	this.label_list = [],
	this.sub_list = [],
	this.output = '';

	get_op.call(this, str);
	console.log('--------------------------------------------');
	console.log('stack:',this.stack, '\nheap:', this.heap, '\nop_list:', this.op_list, '\nlabel_list:', this.label_list);
	console.log('--------------------------------------------');

	let i = 0;
	exec_op.call(this, i, x => x < this.op_list.length);

	console.log('[ output ]: ', this.output);
}

function get_op(str) {
	if (str === '') {
		return ;
	}
	let i = 0;
	while(str[i] !== undefined) {
		let op = map[str[i]];
		i++;
		while(op !== undefined && typeof op[0] !== 'string') {
			op = op[str[i]];
			if (op === undefined) {
				err('syntax err');
			}
			i++;
		}
		// has parameter
		if (op !== undefined && op[1] === 1) {
			let para = '';
			while(str[i] !== 'n') {
				para += str[i];
				i++;
			}
			// parameter need label
			if (label_func.indexOf(op[0]) === -1) {
				para = get_label(para);
			}
			// number
			else {
				para = get_num(para);
			}
			i++;

			this.op_list.push([op[0], para]);
			if (op[0] === 'def') {
				func_map[op[0]].call(this, para);
			}
		}
		// no parameter
		else {
			this.op_list.push(op[0]);
		}
		// console.log(i);
	}
}

function get_num(str) {
	var num = parseInt(str.slice(1).replace(/t/g, '1').replace(/s/g, '0'), 2);
	return str[0] === 't'? (0-num): num;
}

function get_label(str) {
	return parseInt(str.replace(/t/g, '1').replace(/s/g, '0'), 2);
}

function convers(data) {
	return data.toString().replace(/[^\n\t ]/g, '').replace(/\t/g, 't').replace(/\n/g, 'n').replace(/\r/g, '').replace(/ /g, 's');
}

function get_stdin() {
	process.stdin.setEncoding('utf8');
	let input = '';
	process.stdin.on('readable', () => {
		var chunk = process.stdin.read();
		if (chunk !== null) {
			input += chunk;
		}
		else {
			process.stdin.emit('end');
		}
	});

	process.stdin.on('end', () => {
		return input;
	});
}

function exec_op(i, flag) {
	if (typeof flag === 'function') {
		while(flag(i)) { console.log(this.op_list[i]);
			if (typeof this.op_list[i] !== 'object') {
				if (this.op_list[i] === 'output_num' || this.op_list[i] === 'output_char') {
					this.output += func_map[this.op_list[i]].call(this);
				}
				else if (this.op_list[i] === 'input_num' || this.op_list[i] === 'input_char') {
					// let input = get_stdin();
					func_map[this.op_list[i]].call(this);
				}
				else {
					func_map[this.op_list[i]].call(this);
				}
			}
			else {
				if (this.op_list[i][0] !== 'def') {
					func_map[this.op_list[i][0]].call(this, this.op_list[i][1]);
				}
			}
			i++;
		}
	}
	else {
		err('argument err');
	}
}

function is_stack_empty() {
	if (this.stack.length < 1) {
		err('stack empty');
	}
}

function err(msg) {
	throw new Error(msg);
}

var func_map = {
	// I/O
	output_char: function() {
		is_stack_empty.call(this);
		return String.fromCharCode(this.stack.pop());
	},
	output_num: function() {
		is_stack_empty.call(this);
		let num = this.stack.pop();
		return isNaN(num)? 0: num;
	},
	input_char: function() {
		is_stack_empty.call(this);
		if (input !== '') {
			input = input.split('');
			heap[this.stack[this.stack.length-1]] = input.shift().charCodeAt(0);
			input = input.join('');
		}
		else {
			err('no input');
		}
	},
	input_num: function() {
		is_stack_empty.call(this);
		if (input !== '') {
			input = input.split('\n');
			heap[this.stack[this.stack.length-1]] = input.shift();
			input = input.join('\n');
		}
		else {
			err('no input');
		}
	},

	// stack
	push: function(x) {
		if (!isNaN(x)) {
			this.stack.push(x);
		}
		else {
			this.stack.push(0);
		}
	},
	copy: function(x) {
		if (x < 0) {
			err('index out range');
		}
		if (this.stack.length > x) {
			this.stack.push(this.stack[this.stack.length - 1 - x]);
		}
		else {
			err('stack empty');
		}
	},
	remove: function(x) {
		if (x < 0 || x > this.stack.length - 1) {
			stack = [this.stack.pop()];
		}
		else {
			this.stack.splice(this.stack.length -1 - x, x);
		}
	},
	copy_top: function() {
		is_stack_empty.call(this);
		this.stack.push(this.stack[this.stack.length-1]);
	},
	change: function() {
		is_stack_empty.call(this);
		let t = stack[this.stack.length-2];
		stack[this.stack.length-2] = this.stack.pop();
		this.stack.push(t);
	},
	rm_top: function() {
		is_stack_empty.call(this);
		this.stack.pop();
	},

	// ctrl
	end: function() {
		this.stack = [];
		this.heap = {};
		this.op_list = [];
		this.label_list = [];
	},
	def: function(x) {
		if (this.label_list.filter(i => isNaN(x)?isNaN(i[0]): i[0] === x).length !== 0) {
			err('label already def');
		}
		this.label_list.push([x, this.op_list.length-1]);
	},
	call: function(x) {
		let target = this.label_list.filter(i => isNaN(x)?isNaN(i[0]): i[0] === x);
		if (target.length !== 0) {
			let context = this.op_list.filter(i => i==='object' && i[0]==='call');
			sub_list.push([x, this.op_list.indexOf(context)]);

			let index = target[0][1]+1;
			exec_op.call(this, index, (x) => {
				if (x === this.op_list.length - 1 && this.op_list[x] !== 'end') {
					err('return not exists');
				}
				return this.op_list[x] !== 'ret' && x < this.op_list.length;
			});
		}
		else {
			err('unknown sub');
		}
	},
	jump: function(x) {
		let target = this.label_list.filter(i => isNaN(x)?isNaN(i[0]): i[0] === x);
		if (target.length !== 0) {
			let index = target[0][1]+1;
			exec_op.call(this, index, x => x < this.op_list.length);
		}
		else {
			err('label not def');
		}
	},
	jump_zero: function(x) {
		is_stack_empty.call(this);
		if (this.stack.pop() === 0) {
			func_map['jump'].call(this, x);
		}
	},
	jump_nagative: function(x) {
		is_stack_empty.call(this);
		if (this.stack.pop() < 0) {
			func_map['jump'].call(this, x);
		}
	},
	ret: function() {
		if (sub_list.length > 0) {
			func_map[sub_list.pop()].call(this);
		}
		else {
			err('sub return err');
		}
	},

	// heap
	save: function() {
		is_stack_empty.call(this);
		heap[this.stack[this.stack.length-2]] = this.stack.pop();
		this.stack.pop();
	},
	load: function() {
		is_stack_empty.call(this); console.log(heap);
		if (heap.hasOwnProperty(this.stack[this.stack.length-1])) {
			this.stack.push(heap[this.stack.pop()]);
		}
		else {
			err('addr error');
		}
	},

	// math
	add: function() {
		if (this.stack.length < 2) {
			err('stack val err');
		}
		else {
			this.stack.push(this.stack.pop() + this.stack.pop());
		}
	},
	multi: function() {
		if (this.stack.length < 2) {
			err('stack val err');
		}
		else {
			this.stack.push(this.stack.pop() * this.stack.pop());
		}
	},
	minus: function() {
		if (this.stack.length < 2) {
			err('stack val err');
		}
		else {
			this.stack.push(0 - this.stack.pop() + this.stack.pop());
		}
	},
	divide: function() {
		if (this.stack.length < 2) {
			err('stack val err');
		}
		else {
			let argu1 = this.stack.pop(), argu2 = this.stack.pop();
			if (argu1 === 0) {
				err('divisor err');
			}
			this.stack.push(Math.floor(argu2 / argu1));
		}
	},
	mod: function() {
		if (this.stack.length < 2) {
			err('stack val err');
		}
		else {
			let argu1 = this.stack.pop(), argu2 = this.stack.pop();
			if (argu1 === 0) {
				err('modulo by zero');
			}
			else {
				stack.push((argu1 % argu2 + argu2) % argu2);
			}
		}
	}
};

var map = {
	'n': {
		's': {
			's': ['def', 1],
			't': ['call', 1],
			'n': ['jump', 1]
		},
		't': {
			's': ['jump_zero', 1],
			't': ['jump_nagative', 1],
			'n': ['ret', 0]
		},
		'n': {
			'n': ['end', 0]
		}
	},
	't': {
		'n': {
			's': {
				's': ['output_char', 0],
				't': ['output_num', 0]
			},
			't': {
				's': ['input_char', 0],
				't': ['input_num', 0]
			}
		},
		't': {
			's': ['save', 0],
			't': ['load', 0]
		},
		's': {
			's': {
				's': ['add', 0],
				'n': ['multi', 0],
				't': ['minus', 0]
			},
			't': {
				's': ['divide', 0],
				't': ['mod', 0]
			}
		}
	},
	's': {
		's': ['push', 1],
		't': {
			's': ['copy', 1],
			'n': ['remove', 1]
		},
		'n': {
			's': ['copy_top', 0],
			't': ['change', 0],
			'n': ['rm_top', 0]
		}
	}
};

var label_func = ['push', 'remove', 'copy', 'input_num'];