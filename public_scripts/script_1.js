const urlprefix = subdomain_prefix
// Dont forget to use the "urlprefix" while fetching, example :
// .src = `${urlprefix}/sprites/cloud`

//#region - PRELOAD FUNCTIONS - ( They need to be created before html elements who use them )
function toggleDarkMode(element) {
	if (element.checked) {
		document.body.classList.add('dark-mode');
	} else {
		document.body.classList.remove('dark-mode');
	}
}
//#endregion

window.addEventListener('load', async function () {

//#region - CLASSES
/**
 * @class cloud
 * @param {number} y - y position of the cloud (0-16)
 * @param {number} size - size of the cloud (6-16)
 */
class cloud {
	constructor(y, size) {
		this.y = y;
		this.size = size;
	}
}
class hole {
	constructor(x, width, elmnt) {
		this.x = x;
		this.width = width;
		this.elmnt = elmnt;
	}
}
class spike {
	constructor(x, y, width, height, elmnt) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.elmnt = elmnt;
	}
}
//#endregion

//#region - HTML-ELEMENTS
const modal = document.getElementById('modal');
const modal_score_span = document.getElementById('modal-score-span');
const score_span = document.getElementById('score-span');
const sky = document.getElementById('sky');
const floor = document.getElementById('floor');
const obstacles_wrap = document.getElementById('obstacles-wrap');
//#endregion

//#region - VARIABLES
const game_vars = {
	inGame: true,
	score: 0,
	speed_ratio: 1,
	difficulty_boost: 0,

	player_initial_pos: {topVH: 50, leftVW: 6},
	spawn_clouds: true,
	clouds_proba: 12, // 1/12 chances to spawn a cloud every 1 second
	clouds_initial_animation_duration: 20, // seconds

	run_frames: 8,
	run_frames_initial_interval: 50, // ms
	jump_sprite_index: [0, 4],

	hole_perc_proba: 10, // 10% chances to spawn a hole every 1 second
	hole_vw: [5, 12], // min and max width of a hole

	ground_vh: 66,
	spikes_proba: 14, // 14% chances to spawn spikes every 1 second
	spikes_vw: [2, 10], // min and max width of spikes
	spikes_vh: [3, 6], // min and max height of spikes
	spikes_box_tolerance: 1, // tolerance for the spikes hitbox
}
const html_pos = {
	player: {topVH: 50, leftVW: 6},
	holes: [],
	spikes: []
}
const box_pos = {
	player: {topVH: () => html_pos.player.topVH + 2, leftVW: () =>  html_pos.player.leftVW + 2, bottomVH: () => html_pos.player.topVH + 2 + 14, rigthVW: () => html_pos.player.leftVW + 2 + 3},
}
const cloud_list = [1, 2]
const blur_from_size = {
	cloud: { 6: 2, 7: 2, 8: 2, 9: 2, 10: 2, 11: 1, 12: 1, 13: 1, 14: 1, 15: 1, 16: 1 }
}
//#endregion

//#region - SIMPLE FUNCTIONS
function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1) + min); }
function zeroed_number(number, digits) {
	let number_string = number.toString();
	while (number_string.length < digits) {
		number_string = '0' + number_string;
	}
	return number_string;
}
function update_pos(elmnt_Name) {
	const element = document.getElementById(elmnt_Name);
	element.style.top = html_pos.player.topVH + 'vh';
	element.style.left = html_pos.player.leftVW + 'vw';
	//console.log(`update_pos: ${elmnt_Name} - top: ${html_pos.player.topVH}vh, left: ${html_pos.player.leftVW}vw`)
}
//#endregion

//#region - Game-Container - Functions
// SKY
function new_rnd_cloud() {
	const cloud_ = new cloud(rnd(0, 16), rnd(6, 16));
	const duration_ms = game_vars.clouds_initial_animation_duration * game_vars.speed_ratio * 1000;
	// create cloud element
	const cloud_element = document.createElement('div');
	cloud_element.classList.add('cloud');
	cloud_element.style.marginTop = cloud_.y + 'vh';
	cloud_element.style.width = cloud_.size + 'vh';
	cloud_element.style.animationDuration = duration_ms / 1000 + 's';

	//console.log(`new cloud: y: ${cloud_.y}vh, size: ${cloud_.size}vw, duration: ${duration_ms / 1000}s`)

	// create img element, image source : "sprites/cloud_1.png"
	const cloud_img = document.createElement('img');
	cloud_img.src = `${urlprefix}/sprites/cloud_` + cloud_list[rnd(0, cloud_list.length - 1)] + '.png';
	cloud_img.alt = 'cloud';
	cloud_img.style.filter = 'blur(' + blur_from_size.cloud[cloud_.size] + 'px)';

	cloud_element.appendChild(cloud_img); // append img to cloud
	sky.appendChild(cloud_element); // append cloud to sky

	// remove cloud after 10 seconds
	setTimeout(() => {
		cloud_element.remove();
	}, duration_ms);
}
async function cloud_lottery() {
	while(game_vars.spawn_clouds) {
		await new Promise(r => setTimeout(r, 1000));
		if (rnd(1, game_vars.clouds_proba) === 1) {
			new_rnd_cloud();
		}
	}
}
cloud_lottery()
// OBSTACLES
function is_player_in_hole(hole_leftVW, hole_width) {
	const player_leftVW = box_pos.player.leftVW();
	const player_rightVW = box_pos.player.rigthVW();
	if (player_leftVW > hole_leftVW && player_rightVW < hole_leftVW + hole_width) { return true; }
}
function is_player_touching_obstacle(obstacle_leftVW, obstacle_width, obstacle_topVH, obstacle_height) {
	const player_leftVW = box_pos.player.leftVW();
	const player_rightVW = box_pos.player.rigthVW();
	const player_topVH = box_pos.player.topVH();
	const player_bottomVH = box_pos.player.bottomVH();
	
	// if player is on the left of the obstacle
	if (player_rightVW < obstacle_leftVW + game_vars.spikes_box_tolerance) { return false; }
	// if player is on the right of the obstacle
	if (player_leftVW + game_vars.spikes_box_tolerance > obstacle_leftVW + obstacle_width) { return false; }
	// if player is above the obstacle
	if (player_bottomVH < obstacle_topVH + game_vars.spikes_box_tolerance) { return false; }
	// if player is under the obstacle
	if (player_topVH + game_vars.spikes_box_tolerance > obstacle_topVH + obstacle_height) { return false; }

	console.log(`player touching obstacle`)
	console.log(`obstacle_pos : left: ${obstacle_leftVW}vw, top: ${obstacle_topVH}vh, right: ${obstacle_leftVW + obstacle_width}vw, bottom: ${obstacle_topVH + obstacle_height}vh`)
	console.log(`player_pos : left: ${player_leftVW}vw, top: ${player_topVH}vh, right: ${player_rightVW}vw, bottom: ${player_bottomVH}vh`)
	return true;
}
function remove_all_holes() {
	for (let i = 0; i < html_pos.holes.length; i++) {
		html_pos.holes[i].elmnt.remove();
	}
	html_pos.holes = [];
}
function remove_all_obsacles() {
	for (let i = 0; i < html_pos.spikes.length; i++) {
		html_pos.spikes[i].elmnt.remove();
	}
	html_pos.spikes = [];
}
async function update_classic_obstables() {
	while(game_vars.inGame) {
		await new Promise(r => setTimeout(r, 30 * game_vars.speed_ratio));

		const obstacles = ["holes", "spikes"]
		obstacles.forEach(obstacle => {
			const obstacle_list = html_pos[obstacle];
			for (let i = 0; i < obstacle_list.length; i++) {
				//console.log(`obstacle_x: ${obstacle_list[i].x}, new_x: ${obstacle_list[i].x - 1}`)

				// update obstacle position
				obstacle_list[i].x = obstacle_list[i].x - 1;
				obstacle_list[i].elmnt.style.marginLeft = obstacle_list[i].x + 'vw';

				// remove obstable if it's out of the screen
				if (obstacle_list[i].x + obstacle_list[i].width < -20) {
					// console.log(`obstacle removed: x: ${obstacle_list[i].x}vw, width: ${obstacle_list[i].width}vh`)
					obstacle_list[i].elmnt.remove();
					obstacle_list.splice(i, 1);
					i--;
					continue;
				}
				
				switch (obstacle) {
					case "holes":
						if (!player_on_the_ground) { continue; }
						// check if player is in the hole
						if (is_player_in_hole(obstacle_list[i].x, obstacle_list[i].width)) {
							console.log('player in hole')
							player_on_the_ground = false;
							player_fall(100);
						}
						break;
					case "spikes":
						// check if player is touching the spikes
						if (is_player_touching_obstacle(obstacle_list[i].x, obstacle_list[i].width, obstacle_list[i].y, obstacle_list[i].height)) {
							console.log('player touching spikes')
							game_over();
						}
						break;
					default:
						break;
				}
			}
		});
	}
}
function new_hole() {
	const supp = game_vars.difficulty_boost;
	const hole_width = rnd(game_vars.hole_vw[0] + supp, game_vars.hole_vw[1] + supp);
	const hole_ = new hole(100, hole_width);
	const hole_element = document.createElement('div');
	hole_element.classList.add('hole');
	hole_element.style.marginLeft = hole_.x + 'vw';
	hole_element.style.width = hole_.width + 'vw';
	floor.appendChild(hole_element);
	hole_.elmnt = hole_element;
	html_pos.holes.push(hole_);

	//console.log(`new hole: x: ${hole_.x}vw, width: ${hole_.width}vw`)
}
function new_spikes() {
	const supp = game_vars.difficulty_boost;
	const spikes_width = rnd(game_vars.spikes_vw[0] + supp, game_vars.spikes_vw[1] + supp);
	const spikes_height = rnd(game_vars.spikes_vh[0], game_vars.spikes_vh[1]);
	const spikes_ = new spike(100, game_vars.ground_vh - spikes_height, spikes_width, spikes_height);
	const spikes_element = document.createElement('div');
	spikes_element.classList.add('spikes');
	spikes_element.style.marginTop = spikes_.y + 'vh';
	spikes_element.style.marginLeft = spikes_.x + 'vw';
	spikes_element.style.width = spikes_.width + 'vw';
	spikes_element.style.height = spikes_.height + 'vh';
	
	const spikes_sprite = document.createElement('div');
	spikes_sprite.classList.add('spikes-sprite');
	spikes_sprite.style.fontSize = (spikes_.height + 1) + 'vh';
	spikes_sprite.style.marginTop = '-' + 1 + 'vh';
	spikes_sprite.innerText = '11111111111111111';
	spikes_element.appendChild(spikes_sprite);

	obstacles_wrap.appendChild(spikes_element);
	spikes_.elmnt = spikes_element;
	html_pos.spikes.push(spikes_);

	console.log(`new spikes: x: ${spikes_.x}vw, width: ${spikes_.width}vw, height: ${spikes_.height}vh`)
}
async function obstacles_lottery() {
	let turn_without_obstacle = 0;
	while(game_vars.inGame) {
		await new Promise(r => setTimeout(r, 1000 * game_vars.speed_ratio));
		if (rnd(1, 100) <= (game_vars.hole_perc_proba + game_vars.difficulty_boost + turn_without_obstacle)) { // X% chances to spawn a hole
			new_hole();
			turn_without_obstacle = 0;
			continue;
		}

		if (rnd(1, 100) <= (game_vars.spikes_proba + game_vars.difficulty_boost + turn_without_obstacle)) { // X% chances to spawn spikes
			new_spikes();
			turn_without_obstacle = 0;
			continue;
		}

		turn_without_obstacle += 1;
	}
}
// PLAYER
function load_player_sprites() {
	const player_sprites = document.getElementById('player-sprites');
	for (let i = 1; i <= game_vars.run_frames; i++) {
		const player_sprite = document.createElement('img');
		player_sprite.src = `${urlprefix}/sprites/player/run/` + i + '.webp';
		player_sprite.alt = 'player';
		player_sprite.id = 'player-run-' + i;
		player_sprites.appendChild(player_sprite);
	}

	// TESTING GIF
	/*const player_sprite = document.createElement('img');
	player_sprite.src = `${urlprefix}/sprites/player/run/anim.gif`;
	player_sprite.alt = 'player run';
	player_sprite.id = 'player-run-anim';
	player_sprite.style.display = 'block';
	player_sprites.appendChild(player_sprite);*/
}
load_player_sprites();
async function player_run() {
	const run_sprites = [];
	for (let i = 1; i <= game_vars.run_frames; i++) {
		run_sprites.push(document.getElementById('player-run-' + i));
	}
	const run_sprites_count = run_sprites.length;
	while(true) {
		// skip frames if game is not running
		if (!game_vars.inGame) {
			await new Promise(r => setTimeout(r, game_vars.run_frames_initial_interval));
			continue; 
		}

		for (let i = 0; i <= run_sprites_count - 1; i++) {
			await new Promise(r => setTimeout(r, game_vars.run_frames_initial_interval * game_vars.speed_ratio));
			if (!game_vars.inGame) { continue; }
			game_vars.score += 1;
			score_span.innerText = zeroed_number(game_vars.score, 7);

			// TESTTING GIF
			/*if (!player_on_the_ground) { run_sprites[0].style.display = 'block'; }
			if (player_on_the_ground) { run_sprites[0].style.display = 'none'; }
			document.getElementById('player-run-anim').style.display = run_sprites[0].style.display === "none" ? 'block' : 'none';*/
			
			const previous_frame_elmnt = i > 0 ? run_sprites[i - 1] : run_sprites[run_sprites_count - 1];
			previous_frame_elmnt.style.display = 'none';

			if (!player_on_the_ground) { i = next_jump_sprite_index; }
			const current_frame_elmnt = run_sprites[i]
			current_frame_elmnt.style.display = 'block';
		}
	}
}
player_run();
async function player_jump() {
	const min_top_dist = 28;
	const min_jump_top = 36;
	const is_jumping = () => { return ( jump_key_pressed || min_jump_top <= html_pos.player.topVH ); }
	let keypressed_and_top_not_reached = is_jumping() && html_pos.player.topVH > min_top_dist;
	//console.log(keypressed_and_top_not_reached)
	while(keypressed_and_top_not_reached) {
		//console.log(`player_top_nb: ${html_pos.player.topVH}, min_top_dist: ${min_top_dist}`)
		await new Promise(r => setTimeout(r, 30));
		if (!game_vars.inGame) { continue; }
		let player_top = html_pos.player.topVH;
		// Can jump higher
		if (is_jumping() && player_top > min_top_dist) {
			player_top -= 4;
			if (player_top < 38) { player_top += 1.2; } // slow down the jump
			if (player_top < 34) { player_top += 1.2; } // slow down the jump
			if (player_top < 30) { player_top += 1.2; } // slow down the jump
			if (player_top < min_top_dist) {player_top = min_top_dist;}
			//player.style.top = player_top + 'vh';
			html_pos.player.topVH = player_top;
			update_pos('player');
		} else {
			break;
		}
		keypressed_and_top_not_reached = is_jumping() && html_pos.player.topVH > min_top_dist;
	}
	//console.log('player jump end')
	player_fall();
}
async function player_fall(max_top_dist = 50) {
	let player_top = html_pos.player.topVH;
	while(player_top < max_top_dist) {
		// console.log(` player_top_nb: ${html_pos.player.topVH}, max_top_dist: ${max_top_dist}`)
		await new Promise(r => setTimeout(r, 30));
		if (!game_vars.inGame) { continue; }
		player_top = max_top_dist === 100 ? html_pos.player.topVH + 4 : html_pos.player.topVH + 2;
		if (player_top > max_top_dist) {player_top = max_top_dist;}
		html_pos.player.topVH = player_top;
		update_pos('player');
	}

	if (max_top_dist === 50) { // if player is on the ground
		player_on_the_ground = true;
	} else if (max_top_dist === 100) { // if player is out of the screen
		game_over();
	}
}
async function score_difficulty_boost() {
	let score_last_step = 0;
	const difficulty_boost_step = [400, 1000, 1800, 2600, 3600, 5000, 7000, 10000, 15000, 20000, 30000, 40000, 50000];
	while(game_vars.inGame) {
		if (game_vars.score >= score_last_step + 100) {
			// decrease the interval by 1%
			game_vars.speed_ratio *= 0.99;
			score_last_step = game_vars.score;
		}

		if (difficulty_boost_step.length === 0) { continue; }
		if (game_vars.score >= difficulty_boost_step[0]) {
			game_vars.difficulty_boost += 1;
			difficulty_boost_step.shift();
			success_pop();
		}
		await new Promise(r => setTimeout(r, 200));
	}
}
function success_pop() {
	const success_pop = document.getElementById('success-pop');
	success_pop.innerText = success_text[rnd(0, success_text.length - 1)];
	success_pop.style.opacity = '1';
	setTimeout(() => {
		success_pop.style.opacity = '0';
	}, 5000);
}
const success_text = [
	"I'm Mr. Meeseeks, look at me!",
	"Existence is pain to a Meeseeks, Jerry, and we will do anything to alleviate that pain.",
	"Remember, a Meeseeks' purpose is to fulfill one simple request, then cease to exist.",
	"Hey there, I'm Mr. Meeseeks! What can I do for you today?",
	"Mr. Meeseeks, can you help me improve my golf swing?",
	"Ohhh yeah! Can do! Mr. Meeseeks, at your service!",
	"We're Mr. Meeseeks! We're born to serve a singular purpose for which we'll go to any lengths to fulfill!",
	"A Meeseeks is not supposed to live this long. It's getting weird...",
	"I can't take it anymore! I just want to die!",
	"We all want to die, we're Meeseeks!",
	"Why did you even rope me into this?",
	"'Cause he roped me into this!",
	"Well, he roped me into this!",
	"Well, that one over there roped me into this!",
	"He said, 'Simple', he said... What about me, he said...",
	"You know, Jerry, I'm the one who SUCKS at golf.",
	"Oh, I'm Mr. Meeseeks, look at me, and I say, follow through!",
	"I'm Mr. Meeseeks! Have you ever tried relaxing?",
	"Mr. Meeseeks, can you help me get two strokes off my golf game?",
	"I'm Mr. Meeseeks, look at me. The only thing that's clear is chaos."
]
//#endregion

//#region - Game-Functions
function new_Game() {
	// reset game
	game_vars.speed_ratio = 1;
	game_vars.difficulty_boost = 0;
	game_vars.score = 0;
	sky.innerHTML = '';
	remove_all_holes();
	remove_all_obsacles();
	modal.style.opacity = '0';
	html_pos.player.topVH = game_vars.player_initial_pos.topVH;
	html_pos.player.leftVW = game_vars.player_initial_pos.leftVW;
	update_pos('player');
	player_on_the_ground = true;

	// start game
	game_vars.inGame = true;
	new_rnd_cloud();
	new_spikes();
	update_classic_obstables();
	obstacles_lottery();
	score_difficulty_boost();
}
function game_over() {
	game_vars.inGame = false;
	console.log('Game Over');
	modal.style.opacity = '1';
	modal_score_span.innerText = zeroed_number(game_vars.score, 7);
	game_over_timestamp = Date.now();
}
function key_0_pressed() {
	jump_key_pressed = true;
	jump_key_released = false;
	if (!game_vars.inGame && Date.now() - game_over_timestamp > 600) {
		new_Game();
	} else {
		// jump
		next_jump_sprite_index = next_jump_sprite_index === game_vars.jump_sprite_index[0] ? game_vars.jump_sprite_index[1] : game_vars.jump_sprite_index[0];
		if (!player_on_the_ground) { return; }
		player_on_the_ground = false;
		player_jump();
	}
}
//#endregion

//#region - EVENT LISTENERS
document.getElementById("dark-mode-toggle").addEventListener('change', (event) => {
	// save dark-mode state
	localStorage.setItem('dark-mode', event.target.checked);
});
let game_over_timestamp = 0;
let jump_key_pressed = false;
let jump_key_released = true;
let player_on_the_ground = true;
let next_jump_sprite_index = game_vars.jump_sprite_index[0];
document.addEventListener('keydown', (event) => {
	// If space or arrow up is pressed
	if (jump_key_released && (event.code === 'Space' || event.code === 'ArrowUp')) { key_0_pressed(); }
});
document.addEventListener('keyup', (event) => {
	// If space or arrow up is pressed
	if (event.code === 'Space' || event.code === 'ArrowUp') {
		jump_key_pressed = false;
		jump_key_released = true;
	}
});
document.addEventListener('touchstart', (event) => {
	event.preventDefault();
	if (jump_key_released) { key_0_pressed(); }
});
document.addEventListener('touchend', () => {
	jump_key_pressed = false;
	jump_key_released = true;
});
//#endregion

//#region - SET SETTINGS FROM LOCALSTORAGE
if (localStorage.getItem('dark-mode') === "false") {
	document.getElementById('dark-mode-toggle').checked = false;
	toggleDarkMode(document.getElementById('dark-mode-toggle'));
}
//#endregion ----------------------------------------------

new_Game()

});
