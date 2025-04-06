var Colors = {
	red: 0xf25346,
	yellow: 0xedeb27,
	white: 0xd8d0d1,
	brown: 0x59332e,
	pink: 0xF5986E,
	brownDark: 0x23190f,
	blue: 0x68c3c0,
	green: 0x458248,
	purple: 0x551A8B,
	lightgreen: 0x629265,
};



var scene, camera, fieldOfView, aspectRatio, nearPlane, farPlane, HEIGHT, WIDTH, renderer, container;


function createScene() {
	// Get the width and height of the screen
	// and use them to setup the aspect ratio
	// of the camera and the size of the renderer.
	HEIGHT = window.innerHeight;
	WIDTH = window.innerWidth;

	// Create the scene.
	scene = new THREE.Scene();

	// Add FOV Fog effect to the scene. Same colour as the BG int he stylesheet.
	scene.fog = new THREE.Fog(0xf7d9aa, 100, 950);

	// Create the camera
	aspectRatio = WIDTH / HEIGHT;
	fieldOfView = 60;
	nearPlane = 1;
	farPlane = 10000;
	camera = new THREE.PerspectiveCamera(
		fieldOfView,
		aspectRatio,
		nearPlane,
		farPlane
	);

	// Adjust camera for mobile
	if (WIDTH < 600) {
		camera.position.y = 200;
		camera.position.z = 150;
	} else {
		// Position the camera for desktop
		camera.position.x = 0;
		camera.position.y = 150;
		camera.position.z = 100;
	}

	// Create the renderer

	renderer = new THREE.WebGLRenderer({
		// Alpha makes the background transparent, antialias is performant heavy
		alpha: true,
		antialias: true
	});

	//set the size of the renderer to fullscreen
	renderer.setSize(WIDTH, HEIGHT);
	//enable shadow rendering
	renderer.shadowMap.enabled = true;

	// Add the Renderer to the DOM, in the world div.
	container = document.getElementById('world');
	container.appendChild(renderer.domElement);

	//RESPONSIVE LISTENER
	window.addEventListener('resize', handleWindowResize, false);
}

//RESPONSIVE FUNCTION
function handleWindowResize() {
	HEIGHT = window.innerHeight;
	WIDTH = window.innerWidth;
	renderer.setSize(WIDTH, HEIGHT);
	camera.aspect = WIDTH / HEIGHT;

	// Adjust camera position based on screen size
	if (WIDTH < 600) {
		camera.position.y = 200;
		camera.position.z = 150;
	} else {
		camera.position.y = 150;
		camera.position.z = 100;
	}

	camera.updateProjectionMatrix();
}


var hemispshereLight, shadowLight;

function createLights() {
	// Gradient coloured light - Sky, Ground, Intensity
	hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, .9)
	// Parallel rays
	shadowLight = new THREE.DirectionalLight(0xffffff, .9);



	shadowLight.position.set(0, 350, 350);
	shadowLight.castShadow = true;

	// define the visible area of the projected shadow
	shadowLight.shadow.camera.left = -650;
	shadowLight.shadow.camera.right = 650;
	shadowLight.shadow.camera.top = 650;
	shadowLight.shadow.camera.bottom = -650;
	shadowLight.shadow.camera.near = 1;
	shadowLight.shadow.camera.far = 1000;

	// Shadow map size
	shadowLight.shadow.mapSize.width = 2048;
	shadowLight.shadow.mapSize.height = 2048;

	// Add the lights to the scene
	scene.add(hemisphereLight);

	scene.add(shadowLight);
}


Land = function () {
	var geom = new THREE.CylinderGeometry(600, 600, 1700, 40, 10);
	//rotate on the x axis
	geom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
	//create a material
	var mat = new THREE.MeshPhongMaterial({
		color: Colors.lightgreen,
		shading: THREE.FlatShading,
	});

	//create a mesh of the object
	this.mesh = new THREE.Mesh(geom, mat);
	//receive shadows
	this.mesh.receiveShadow = true;
}

Orbit = function () {

	var geom = new THREE.Object3D();

	this.mesh = geom;
	//this.mesh.add(sun);
}

Sun = function () {

	this.mesh = new THREE.Object3D();

	var sunGeom = new THREE.SphereGeometry(400, 20, 10);
	var sunMat = new THREE.MeshPhongMaterial({
		color: Colors.yellow,
		shading: THREE.FlatShading,
	});
	var sun = new THREE.Mesh(sunGeom, sunMat);
	sun.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
	sun.castShadow = false;
	sun.receiveShadow = false;
	this.mesh.add(sun);
}

var imagePaths = [
];
var currentIndex = 0;

// Cloudinary configuration
var cloudinaryConfig = {
	cloudName: 'diadiykyk', // Thay bằng cloud name của bạn
	uploadPreset: 'buihainghia_upload_preset', // Thay bằng unsigned upload preset của bạn
};

// Hàm để tải ảnh từ URL và lưu lên Cloudinary
async function downloadAndUploadToCloudinary(url, showMessages = true) {
	try {
		if (showMessages) {
			showNotification('Đang tải ảnh...');
		}

		// Process Google Drive links
		if (isGoogleDriveLink(url)) {
			try {
				const fileId = extractGoogleDriveFileId(url);
				console.log('Extracted Google Drive file ID:', fileId);

				if (!fileId) {
					throw new Error('Không thể xác định ID file từ link Google Drive');
				}

				url = getGoogleDriveDirectLink(url);
				console.log('Converted to Google Drive direct link:', url);
			} catch (error) {
				console.error('Error processing Google Drive link:', error);
				if (showMessages) {
					showNotification('Link Google Drive không hợp lệ!', true);
				}
				throw error;
			}
		}

		// Tải ảnh từ URL dưới dạng blob
		const blob = await downloadImageAsBlob(url);

		// Upload blob lên Cloudinary
		const cloudinaryUrl = await uploadToCloudinary(blob);

		// Lưu URL Cloudinary vào hệ thống
		await addImagePath(cloudinaryUrl, showMessages);

		if (showMessages) {
			showNotification('Đã tải và lưu ảnh thành công!');
		}

		return cloudinaryUrl;
	} catch (error) {
		console.error('Error downloading and uploading image:', error);
		if (showMessages) {
			showNotification('Có lỗi khi tải ảnh!', true);
		}
		throw error;
	}
}

// Hàm tải ảnh từ URL và chuyển thành blob
async function downloadImageAsBlob(url) {
	try {
		const response = await fetch(url, {
			mode: 'cors',
			cache: 'no-cache',
		});

		if (!response.ok) {
			throw new Error(`Không thể tải ảnh: ${response.statusText}`);
		}

		return await response.blob();
	} catch (error) {
		console.error('Error downloading image:', error);
		throw new Error('Không thể tải ảnh từ đường dẫn này');
	}
}

// Hàm upload ảnh lên Cloudinary
async function uploadToCloudinary(blob) {
	return new Promise((resolve, reject) => {
		const formData = new FormData();
		formData.append('file', blob);
		formData.append('upload_preset', cloudinaryConfig.uploadPreset);

		fetch(`https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`, {
			method: 'POST',
			body: formData,
		})
			.then(response => {
				if (!response.ok) {
					throw new Error('Không thể upload ảnh lên Cloudinary');
				}
				return response.json();
			})
			.then(data => {
				if (data.secure_url) {
					resolve(data.secure_url);
				} else {
					reject(new Error('Không nhận được đường dẫn ảnh từ Cloudinary'));
				}
			})
			.catch(error => {
				console.error('Error uploading to Cloudinary:', error);
				reject(error);
			});
	});
}

// Hàm để thêm form nhập URL ảnh vào giao diện
function addUrlInputForm() {
	const uploadInterface = document.getElementById('upload-interface');
	if (!uploadInterface) return;

	const urlFormContainer = document.createElement('div');
	urlFormContainer.className = 'url-form-container';
	urlFormContainer.style.marginBottom = '20px';
	urlFormContainer.style.display = 'flex';
	urlFormContainer.style.flexDirection = 'column';
	urlFormContainer.style.gap = '10px';

	const urlTitle = document.createElement('div');
	urlTitle.textContent = 'Hoặc nhập đường dẫn ảnh từ internet:';
	urlTitle.style.marginTop = '20px';
	urlTitle.style.marginBottom = '5px';
	urlTitle.style.fontWeight = 'bold';
	urlTitle.style.color = '#23190f';

	// Thêm nút radio để chọn chế độ nhập liệu
	const modeContainer = document.createElement('div');
	modeContainer.style.display = 'flex';
	modeContainer.style.gap = '15px';
	modeContainer.style.marginBottom = '10px';

	// Radio cho kiểu nhập một URL
	const singleModeLabel = document.createElement('label');
	singleModeLabel.style.display = 'flex';
	singleModeLabel.style.alignItems = 'center';
	singleModeLabel.style.gap = '5px';
	singleModeLabel.style.cursor = 'pointer';

	const singleModeRadio = document.createElement('input');
	singleModeRadio.type = 'radio';
	singleModeRadio.name = 'url-input-mode';
	singleModeRadio.value = 'single';
	singleModeRadio.checked = true;
	singleModeRadio.style.cursor = 'pointer';

	singleModeLabel.appendChild(singleModeRadio);
	singleModeLabel.appendChild(document.createTextNode('Một ảnh'));

	// Radio cho kiểu nhập nhiều URL
	const multiModeLabel = document.createElement('label');
	multiModeLabel.style.display = 'flex';
	multiModeLabel.style.alignItems = 'center';
	multiModeLabel.style.gap = '5px';
	multiModeLabel.style.cursor = 'pointer';

	const multiModeRadio = document.createElement('input');
	multiModeRadio.type = 'radio';
	multiModeRadio.name = 'url-input-mode';
	multiModeRadio.value = 'multi';
	multiModeRadio.style.cursor = 'pointer';

	multiModeLabel.appendChild(multiModeRadio);
	multiModeLabel.appendChild(document.createTextNode('Nhiều ảnh'));

	modeContainer.appendChild(singleModeLabel);
	modeContainer.appendChild(multiModeLabel);

	// Container cho input đơn
	const singleInputContainer = document.createElement('div');
	singleInputContainer.id = 'single-input-container';
	singleInputContainer.style.display = 'flex';
	singleInputContainer.style.gap = '10px';

	const urlInput = document.createElement('input');
	urlInput.type = 'text';
	urlInput.placeholder = 'Nhập đường dẫn ảnh...';
	urlInput.id = 'image-url-input';
	urlInput.style.flex = '1';
	urlInput.style.padding = '10px';
	urlInput.style.borderRadius = '8px';
	urlInput.style.border = '1px solid #ddd';

	const downloadBtn = document.createElement('button');
	downloadBtn.textContent = 'Tải ảnh';
	downloadBtn.className = 'download-btn';
	downloadBtn.style.backgroundColor = '#68c3c0';
	downloadBtn.style.color = 'white';
	downloadBtn.style.padding = '10px 15px';
	downloadBtn.style.border = 'none';
	downloadBtn.style.borderRadius = '8px';
	downloadBtn.style.cursor = 'pointer';
	downloadBtn.style.fontWeight = 'bold';
	downloadBtn.style.transition = 'background-color 0.2s ease';

	downloadBtn.addEventListener('mouseenter', () => {
		downloadBtn.style.backgroundColor = '#5ab8b5';
	});

	downloadBtn.addEventListener('mouseleave', () => {
		downloadBtn.style.backgroundColor = '#68c3c0';
	});

	downloadBtn.addEventListener('click', () => {
		const url = urlInput.value.trim();
		if (url) {
			downloadAndUploadToCloudinary(url);
			urlInput.value = '';
		} else {
			showNotification('Vui lòng nhập đường dẫn ảnh!', true);
		}
	});

	singleInputContainer.appendChild(urlInput);
	singleInputContainer.appendChild(downloadBtn);

	// Container cho input nhiều ảnh
	const multiInputContainer = document.createElement('div');
	multiInputContainer.id = 'multi-input-container';
	multiInputContainer.style.display = 'none'; // Ẩn đi ban đầu
	multiInputContainer.style.flexDirection = 'column';
	multiInputContainer.style.gap = '10px';

	const multiUrlTextArea = document.createElement('textarea');
	multiUrlTextArea.id = 'multi-image-url-input';
	multiUrlTextArea.placeholder = 'Nhập nhiều đường dẫn ảnh, mỗi dòng một URL...';
	multiUrlTextArea.style.width = '100%';
	multiUrlTextArea.style.height = '120px';
	multiUrlTextArea.style.padding = '10px';
	multiUrlTextArea.style.borderRadius = '8px';
	multiUrlTextArea.style.border = '1px solid #ddd';
	multiUrlTextArea.style.resize = 'vertical';

	const multiDownloadBtn = document.createElement('button');
	multiDownloadBtn.textContent = 'Tải tất cả ảnh';
	multiDownloadBtn.className = 'download-btn';
	multiDownloadBtn.style.backgroundColor = '#68c3c0';
	multiDownloadBtn.style.color = 'white';
	multiDownloadBtn.style.padding = '10px 15px';
	multiDownloadBtn.style.border = 'none';
	multiDownloadBtn.style.borderRadius = '8px';
	multiDownloadBtn.style.cursor = 'pointer';
	multiDownloadBtn.style.fontWeight = 'bold';
	multiDownloadBtn.style.transition = 'background-color 0.2s ease';
	multiDownloadBtn.style.alignSelf = 'flex-end';

	multiDownloadBtn.addEventListener('mouseenter', () => {
		multiDownloadBtn.style.backgroundColor = '#5ab8b5';
	});

	multiDownloadBtn.addEventListener('mouseleave', () => {
		multiDownloadBtn.style.backgroundColor = '#68c3c0';
	});

	multiDownloadBtn.addEventListener('click', async () => {
		const urls = multiUrlTextArea.value.trim().split('\n').filter(url => url.trim() !== '');
		if (urls.length > 0) {
			const uploadSuccess = await downloadMultipleImagesSequentially(urls);
			multiUrlTextArea.value = '';

			// Nếu có ít nhất một ảnh tải thành công, refresh trang sau 2 giây
			if (uploadSuccess) {
				setTimeout(() => {
					showNotification('Cập nhật trang để hiển thị ảnh mới...');
					setTimeout(() => {
						window.location.reload();
					}, 1000);
				}, 2000);
			}
		} else {
			showNotification('Vui lòng nhập ít nhất một đường dẫn ảnh!', true);
		}
	});

	urlFormContainer.appendChild(urlTitle);
	urlFormContainer.appendChild(modeContainer);
	urlFormContainer.appendChild(singleInputContainer);
	urlFormContainer.appendChild(multiInputContainer);

	// Chèn form URL trước gallery nhưng sau nút upload
	const gallery = document.getElementById('image-gallery');
	uploadInterface.insertBefore(urlFormContainer, gallery);
}

// Hàm để thêm đường dẫn mới vào mảng imagePaths
async function addImagePath(url, showMessages = true, isBatch = false) {
	try {
		// Add to the API
		await api.addImage(url);
		console.log('Added image:', url);

		// Add to local array
		imagePaths.push(url);

		// Thông báo cho người dùng
		if (showMessages && !isBatch) {
			showNotification('Đã thêm ảnh thành công!');
		}

		// Cập nhật ảnh hiển thị trong danh sách
		await updateImageGallery();

		// Tạo một đám mây mới với ảnh vừa thêm
		updateSky();

		// Thêm mới: refresh trang sau khi thêm ảnh thành công
		// Chỉ refresh khi không phải là một phần của batch upload
		if (showMessages && !isBatch) {
			// Đợi 1.5 giây để người dùng thấy thông báo thành công trước khi refresh
			setTimeout(() => {
				window.location.reload();
			}, 1500);
		}

		return true;
	} catch (error) {
		if (showMessages) {
			showNotification('Có lỗi khi thêm ảnh!', true);
		}
		console.error('Error adding image:', error);
		throw error;
	}
}

// Hàm hiển thị thông báo
function showNotification(message, isError = false) {
	const notification = document.getElementById('notification');
	if (notification) {
		notification.textContent = message;
		notification.style.backgroundColor = isError ? 'rgba(242, 83, 70, 0.9)' : 'rgba(69, 130, 72, 0.9)';
		notification.classList.add('show');

		setTimeout(() => {
			notification.classList.remove('show');
		}, 3000);
	}
}

// Hàm cập nhật gallery hiển thị
async function updateImageGallery() {
	const gallery = document.getElementById('image-gallery');
	if (!gallery) return [];

	try {
		// Fetch images from API
		const images = await api.getImages();
		imagePaths = images.map(img => img.url);
		console.log('Loaded images:', imagePaths);

		gallery.innerHTML = '';

		images.forEach((image) => {
			const imgContainer = document.createElement('div');
			imgContainer.className = 'gallery-img-container';

			const img = document.createElement('img');
			img.src = image.url;
			img.alt = 'Uploaded image';

			const deleteBtn = document.createElement('button');
			deleteBtn.className = 'delete-img-btn';
			deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
			deleteBtn.onclick = (event) => {
				event.stopPropagation(); // Stop event propagation to prevent zoom
				removeImage(image.id);
			};

			imgContainer.appendChild(img);
			imgContainer.appendChild(deleteBtn);
			gallery.appendChild(imgContainer);
		});

		return images;
	} catch (error) {
		console.error('Error updating gallery:', error);
		showNotification('Không thể tải danh sách ảnh', true);
		return [];
	}
}

// Cache for textures
const textureCache = {};

// Hàm xóa ảnh tối ưu
async function removeImage(id) {
	try {
		// Lấy URL ảnh trước khi xóa để xóa khỏi cache
		const images = await api.getImages();
		const imageToDelete = images.find(img => img.id === id);

		if (imageToDelete && imageToDelete.url && textureCache[ imageToDelete.url ]) {
			// Xóa texture khỏi cache và giải phóng bộ nhớ GPU
			const texture = textureCache[ imageToDelete.url ];
			texture.dispose();
			delete textureCache[ imageToDelete.url ];
			console.log('Disposed texture from cache:', imageToDelete.url);
		}

		// Gọi API xóa ảnh
		await api.deleteImage(id);

		// Cập nhật gallery
		await updateImageGallery();

		// Thông báo
		showNotification('Đã xóa ảnh!');

		// Refresh trang sau khi xóa ảnh thành công
		setTimeout(() => {
			window.location.reload();
		}, 2000); // Đợi 2 giây để người dùng thấy thông báo xóa thành công

	} catch (error) {
		console.error('Error removing image:', error);
		showNotification('Có lỗi khi xóa ảnh!', true);
	}
}

// Hàm khởi tạo upload widget của Cloudinary
function initUploadWidget() {
	// Hiển thị chú thích về số lượng ảnh tối đa
	showNotification('Bạn có thể chọn tối đa 10 ảnh để tải lên 1 lần, tối đa 1000 cái 😀', false);

	return cloudinary.createUploadWidget(
		{
			cloudName: cloudinaryConfig.cloudName,
			uploadPreset: cloudinaryConfig.uploadPreset,
			sources: [ 'local', 'camera' ],
			multiple: true, // Cho phép chọn nhiều ảnh cùng lúc
			maxFiles: 10, // Giới hạn tối đa 10 ảnh mỗi lần tải lên
			maxFileSize: 5000000, // 5MB
			text: {
				en: {
					menu: {
						files: 'Tải lên tối đa 10 ảnh 1 lần, tối đa 1000 cái 😀',
					}
				}
			},
			styles: {
				palette: {
					window: "#F5986E",
					sourceBg: "#FFFFFF",
					windowBorder: "#F7D9AA",
					tabIcon: "#FFFFFF",
					inactiveTabIcon: "#E8E8E8",
					menuIcons: "#23190f",
					link: "#f25346",
					action: "#68c3c0",
					inProgress: "#68c3c0",
					complete: "#458248",
					error: "#f25346",
					textDark: "#23190f",
					textLight: "#FFFFFF"
				}
			}
		},
		(error, result) => {
			if (!error && result && result.event === "success") {
				// Lấy URL của ảnh đã upload
				const imageUrl = result.info.secure_url;
				addImagePath(imageUrl);
			}
		}
	);
}

// Hàm để mở upload widget
function openUploadWidget() {
	const uploadWidget = initUploadWidget();
	uploadWidget.open();
}

// Load ảnh từ localStorage khi khởi động
function loadSavedImages() {
	const savedImages = localStorage.getItem('nitcneImagePaths');
	if (savedImages) {
		try {
			const parsedImages = JSON.parse(savedImages);
			if (Array.isArray(parsedImages)) {
				imagePaths = parsedImages;
				updateImageGallery();
			}
		} catch (e) {
			console.error('Error loading saved images', e);
		}
	}
}

// Mở/đóng giao diện upload
function toggleUploadInterface() {
	const uploadInterface = document.getElementById('upload-interface');
	if (uploadInterface) {
		uploadInterface.classList.toggle('active');
	}
}

// Hàm để lấy hình ảnh theo thứ tự
function getSequentialImagePath() {
	if (imagePaths.length === 0) {
		return null; // Trả về null thay vì chuỗi rỗng
	}

	// Lấy và kiểm tra đường dẫn ảnh
	var imagePath = imagePaths[ currentIndex ];
	if (!imagePath) {
		console.warn('Invalid image path at index', currentIndex);
		return null;
	}

	// Cập nhật index cho lần gọi tiếp theo
	currentIndex = (currentIndex + 1) % imagePaths.length;

	// In ra đường dẫn ảnh để debug
	console.log('Using image path:', imagePath);
	return imagePath;
}

function getImageSize(url, callback) {
	// Kiểm tra nếu URL không hợp lệ
	if (!url || typeof url !== 'string') {
		console.warn('Invalid image URL provided to getImageSize');
		// Trả về kích thước mặc định
		callback(300, 300);
		return;
	}

	var img = new Image();

	// Xử lý lỗi cho ảnh
	img.onerror = function () {
		console.warn('Error loading image for size calculation:', url);
		// Trả về kích thước mặc định
		callback(300, 300);
	};

	img.onload = function () {
		callback(this.width, this.height);
	};

	img.src = url;
}

Cloud = function () {
	// Tạo một container trống cho hình mây
	this.mesh = new THREE.Object3D();

	// Chọn hình ảnh theo thứ tự
	var imagePath = getSequentialImagePath();

	// Kiểm tra nếu không có ảnh hoặc ảnh rỗng
	if (!imagePath) {
		console.log('No image available for Cloud');
		return;
	}

	// Tạo một trình tải kết cấu với cài đặt CORS
	var textureLoader = new THREE.TextureLoader();
	textureLoader.crossOrigin = 'anonymous'; // Đặt crossOrigin là 'anonymous' để tải được ảnh từ domain khác

	// Tải texture với callback và xử lý lỗi
	textureLoader.load(
		imagePath,
		function (texture) {
			// Khi tải thành công
			console.log('Texture loaded successfully:', imagePath);

			// Improve texture quality - Extreme settings
			texture.minFilter = THREE.LinearMipMapLinearFilter; // Use the best filtering
			texture.magFilter = THREE.LinearFilter;
			texture.anisotropy = renderer.capabilities.getMaxAnisotropy(); // Maximize anisotropy
			texture.encoding = THREE.sRGBEncoding; // Ensure correct color encoding
			texture.generateMipmaps = true; // Generate mipmaps for smoother rendering at different distances
			texture.format = THREE.RGBAFormat; // Force RGBA format
			texture.needsUpdate = true;

			// Lấy kích thước của texture
			var imageWidth = texture.image.width || 300;
			var imageHeight = texture.image.height || 300;
			var aspectRatio = imageWidth / imageHeight;

			// Tạo geometry với tỉ lệ khung hình chính xác
			var geom = new THREE.PlaneGeometry(50 * aspectRatio, 50, 1, 1); // Increase size for much better resolution

			// Tạo vật liệu với kết cấu hình ảnh - Sử dụng MeshBasicMaterial để không bị ảnh hưởng bởi ánh sáng
			var mat = new THREE.MeshBasicMaterial({
				map: texture,
				side: THREE.DoubleSide,
				transparent: true,
				color: 0xffffff, // Default color
			});

			// Tăng độ sáng bằng cách thay đổi giá trị màu
			mat.color.setHSL(0, 0, 0.7); // Adjust the lightness (last parameter) to increase brightness

			// Tạo mesh từ geometry và material
			var m = new THREE.Mesh(geom, mat);

			// Add click event listener
			m.userData = { URL: imagePath }; // Store URL for zoom
			m.cursor = 'pointer';

			m.addEventListener('click', function (event) {
				zoomImage(event.target.userData.URL);
			});

			// Định vị mesh
			m.position.x = 100;
			m.position.y = 0;
			m.position.z = Math.random() * 10;
			m.rotation.z = Math.PI * 2 + 135;
			m.rotation.y = 0;

			// Đặt tỉ lệ
			var s = 1 + Math.random() * 2;  // Reduced scale range for clearer images
			m.scale.set(s, s, s);

			// Thêm vào container
			this.mesh.add(m);
		}.bind(this), // Sử dụng bind để giữ nguyên context của 'this'
		undefined, // onProgress callback
		function (err) {
			// Nếu có lỗi khi tải texture
			console.error('Error loading texture:', imagePath, err);
		}
	);
};

// Constructor cho đối tượng Sky
Sky = function () {
	this.mesh = new THREE.Object3D();

	// Số lượng nhóm mây
	this.nClouds = 62;

	// Góc bước đều
	var stepAngle = Math.PI * 2 / this.nClouds;

	// Tạo các đám mây
	for (var i = 0; i < this.nClouds; i++) {
		var c = new Cloud();

		// Xoay và đặt vị trí sử dụng toán học lượng giác
		var a = stepAngle * i;
		// Khoảng cách giữa tâm trục và đám mây
		var h = 725 + Math.random() * 200;
		c.mesh.position.y = Math.sin(a) * h;
		c.mesh.position.x = Math.cos(a) * h;

		// Xoay đám mây theo vị trí của nó
		c.mesh.rotation.z = a + Math.PI / 2;

		// Độ sâu ngẫu nhiên cho các đám mây trên trục z
		c.mesh.position.z = -200 - Math.random() * 200;

		// Tỉ lệ ngẫu nhiên cho mỗi đám mây
		var s = 1 + Math.random() * 2;
		c.mesh.scale.set(s, s, s);

		this.mesh.add(c.mesh);
	}
};


Tree = function () {

	this.mesh = new THREE.Object3D();

	var matTreeLeaves = new THREE.MeshPhongMaterial({ color: Colors.green, shading: THREE.FlatShading });

	var geonTreeBase = new THREE.BoxGeometry(10, 20, 10);
	var matTreeBase = new THREE.MeshBasicMaterial({ color: Colors.brown });
	var treeBase = new THREE.Mesh(geonTreeBase, matTreeBase);
	treeBase.castShadow = true;
	treeBase.receiveShadow = true;
	this.mesh.add(treeBase);

	var geomTreeLeaves1 = new THREE.CylinderGeometry(1, 12 * 3, 12 * 3, 4);
	var treeLeaves1 = new THREE.Mesh(geomTreeLeaves1, matTreeLeaves);
	treeLeaves1.castShadow = true;
	treeLeaves1.receiveShadow = true;
	treeLeaves1.position.y = 20
	this.mesh.add(treeLeaves1);

	var geomTreeLeaves2 = new THREE.CylinderGeometry(1, 9 * 3, 9 * 3, 4);
	var treeLeaves2 = new THREE.Mesh(geomTreeLeaves2, matTreeLeaves);
	treeLeaves2.castShadow = true;
	treeLeaves2.position.y = 40;
	treeLeaves2.receiveShadow = true;
	this.mesh.add(treeLeaves2);

	var geomTreeLeaves3 = new THREE.CylinderGeometry(1, 6 * 3, 6 * 3, 4);
	var treeLeaves3 = new THREE.Mesh(geomTreeLeaves3, matTreeLeaves);
	treeLeaves3.castShadow = true;
	treeLeaves3.position.y = 55;
	treeLeaves3.receiveShadow = true;
	this.mesh.add(treeLeaves3);

}

Flower = function () {

	this.mesh = new THREE.Object3D();

	var geomStem = new THREE.BoxGeometry(5, 50, 5, 1, 1, 1);
	var matStem = new THREE.MeshPhongMaterial({ color: Colors.green, shading: THREE.FlatShading });
	var stem = new THREE.Mesh(geomStem, matStem);
	stem.castShadow = false;
	stem.receiveShadow = true;
	this.mesh.add(stem);


	var geomPetalCore = new THREE.BoxGeometry(10, 10, 10, 1, 1, 1);
	var matPetalCore = new THREE.MeshPhongMaterial({ color: Colors.yellow, shading: THREE.FlatShading });
	petalCore = new THREE.Mesh(geomPetalCore, matPetalCore);
	petalCore.castShadow = false;
	petalCore.receiveShadow = true;

	var petalColor = petalColors[ Math.floor(Math.random() * 3) ];

	var geomPetal = new THREE.BoxGeometry(15, 20, 5, 1, 1, 1);
	var matPetal = new THREE.MeshBasicMaterial({ color: petalColor });
	geomPetal.vertices[ 5 ].y -= 4;
	geomPetal.vertices[ 4 ].y -= 4;
	geomPetal.vertices[ 7 ].y += 4;
	geomPetal.vertices[ 6 ].y += 4;
	geomPetal.translate(12.5, 0, 3);

	var petals = [];
	for (var i = 0; i < 4; i++) {

		petals[ i ] = new THREE.Mesh(geomPetal, matPetal);
		petals[ i ].rotation.z = i * Math.PI / 2;
		petals[ i ].castShadow = true;
		petals[ i ].receiveShadow = true;
	}

	petalCore.add(petals[ 0 ], petals[ 1 ], petals[ 2 ], petals[ 3 ]);
	petalCore.position.y = 25;
	petalCore.position.z = 3;
	this.mesh.add(petalCore);

}

var petalColors = [ Colors.red, Colors.yellow, Colors.blue ];



Forest = function () {

	this.mesh = new THREE.Object3D();

	// Number of Trees
	this.nTrees = 300;

	// Space the consistenly
	var stepAngle = Math.PI * 2 / this.nTrees;

	// Create the Trees

	for (var i = 0; i < this.nTrees; i++) {

		var t = new Tree();

		//set rotation and position using trigonometry
		var a = stepAngle * i;
		// this is the distance between the center of the axis and the tree itself
		var h = 605;
		t.mesh.position.y = Math.sin(a) * h;
		t.mesh.position.x = Math.cos(a) * h;

		// rotate the tree according to its position
		t.mesh.rotation.z = a + (Math.PI / 2) * 3;

		//Andreas Trigo funtime
		//t.mesh.rotation.z = Math.atan2(t.mesh.position.y, t.mesh.position.x)-Math.PI/2;

		// random depth for the tree on the z-axis
		t.mesh.position.z = 0 - Math.random() * 600;

		// random scale for each tree
		var s = .3 + Math.random() * .75;
		t.mesh.scale.set(s, s, s);

		this.mesh.add(t.mesh);
	}

	// Number of Trees
	this.nFlowers = 350;

	var stepAngle = Math.PI * 2 / this.nFlowers;


	for (var i = 0; i < this.nFlowers; i++) {

		var f = new Flower();
		var a = stepAngle * i;

		var h = 605;
		f.mesh.position.y = Math.sin(a) * h;
		f.mesh.position.x = Math.cos(a) * h;

		f.mesh.rotation.z = a + (Math.PI / 2) * 3;

		f.mesh.position.z = 0 - Math.random() * 600;

		var s = .1 + Math.random() * .3;
		f.mesh.scale.set(s, s, s);

		this.mesh.add(f.mesh);
	}

}

var AirPlane = function () {

	this.mesh = new THREE.Object3D();

	// Create the cabin
	var geomCockpit = new THREE.BoxGeometry(80, 50, 50, 1, 1, 1);
	var matCockpit = new THREE.MeshPhongMaterial({ color: Colors.red, shading: THREE.FlatShading });
	geomCockpit.vertices[ 4 ].y -= 10;
	geomCockpit.vertices[ 4 ].z += 20;
	geomCockpit.vertices[ 5 ].y -= 10;
	geomCockpit.vertices[ 5 ].z -= 20;
	geomCockpit.vertices[ 6 ].y += 30;
	geomCockpit.vertices[ 6 ].z += 20;
	geomCockpit.vertices[ 7 ].y += 30;
	geomCockpit.vertices[ 7 ].z -= 20;
	var cockpit = new THREE.Mesh(geomCockpit, matCockpit);
	cockpit.castShadow = true;
	cockpit.receiveShadow = true;
	this.mesh.add(cockpit);

	// Create the engine
	var geomEngine = new THREE.BoxGeometry(20, 50, 50, 1, 1, 1);
	var matEngine = new THREE.MeshPhongMaterial({ color: Colors.white, shading: THREE.FlatShading });
	var engine = new THREE.Mesh(geomEngine, matEngine);
	engine.position.x = 40;
	engine.castShadow = true;
	engine.receiveShadow = true;
	this.mesh.add(engine);

	// Create the tail
	var geomTailPlane = new THREE.BoxGeometry(15, 20, 5, 1, 1, 1);
	var matTailPlane = new THREE.MeshPhongMaterial({ color: Colors.red, shading: THREE.FlatShading });
	var tailPlane = new THREE.Mesh(geomTailPlane, matTailPlane);
	tailPlane.position.set(-35, 25, 0);
	tailPlane.castShadow = true;
	tailPlane.receiveShadow = true;
	this.mesh.add(tailPlane);

	// Create the wing
	var geomSideWing = new THREE.BoxGeometry(40, 4, 150, 1, 1, 1);
	var matSideWing = new THREE.MeshPhongMaterial({ color: Colors.red, shading: THREE.FlatShading });

	var sideWingTop = new THREE.Mesh(geomSideWing, matSideWing);
	var sideWingBottom = new THREE.Mesh(geomSideWing, matSideWing);
	sideWingTop.castShadow = true;
	sideWingTop.receiveShadow = true;
	sideWingBottom.castShadow = true;
	sideWingBottom.receiveShadow = true;

	sideWingTop.position.set(20, 12, 0);
	sideWingBottom.position.set(20, -3, 0);
	this.mesh.add(sideWingTop);
	this.mesh.add(sideWingBottom);

	var geomWindshield = new THREE.BoxGeometry(3, 15, 20, 1, 1, 1);
	var matWindshield = new THREE.MeshPhongMaterial({ color: Colors.white, transparent: true, opacity: .3, shading: THREE.FlatShading });;
	var windshield = new THREE.Mesh(geomWindshield, matWindshield);
	windshield.position.set(5, 27, 0);

	windshield.castShadow = true;
	windshield.receiveShadow = true;

	this.mesh.add(windshield);

	var geomPropeller = new THREE.BoxGeometry(20, 10, 10, 1, 1, 1);
	geomPropeller.vertices[ 4 ].y -= 5;
	geomPropeller.vertices[ 4 ].z += 5;
	geomPropeller.vertices[ 5 ].y -= 5;
	geomPropeller.vertices[ 5 ].z -= 5;
	geomPropeller.vertices[ 6 ].y += 5;
	geomPropeller.vertices[ 6 ].z += 5;
	geomPropeller.vertices[ 7 ].y += 5;
	geomPropeller.vertices[ 7 ].z -= 5;
	var matPropeller = new THREE.MeshPhongMaterial({ color: Colors.brown, shading: THREE.FlatShading });
	this.propeller = new THREE.Mesh(geomPropeller, matPropeller);
	this.propeller.castShadow = true;
	this.propeller.receiveShadow = true;


	var geomBlade1 = new THREE.BoxGeometry(1, 100, 10, 1, 1, 1);
	var geomBlade2 = new THREE.BoxGeometry(1, 10, 100, 1, 1, 1);
	var matBlade = new THREE.MeshPhongMaterial({ color: Colors.brownDark, shading: THREE.FlatShading });

	var blade1 = new THREE.Mesh(geomBlade1, matBlade);
	blade1.position.set(8, 0, 0);
	blade1.castShadow = true;
	blade1.receiveShadow = true;

	var blade2 = new THREE.Mesh(geomBlade2, matBlade);
	blade2.position.set(8, 0, 0);
	blade2.castShadow = true;
	blade2.receiveShadow = true;
	this.propeller.add(blade1, blade2);
	this.propeller.position.set(50, 0, 0);
	this.mesh.add(this.propeller);

	var wheelProtecGeom = new THREE.BoxGeometry(30, 15, 10, 1, 1, 1);
	var wheelProtecMat = new THREE.MeshPhongMaterial({ color: Colors.white, shading: THREE.FlatShading });
	var wheelProtecR = new THREE.Mesh(wheelProtecGeom, wheelProtecMat);
	wheelProtecR.position.set(25, -20, 25);
	this.mesh.add(wheelProtecR);

	var wheelTireGeom = new THREE.BoxGeometry(24, 24, 4);
	var wheelTireMat = new THREE.MeshPhongMaterial({ color: Colors.brownDark, shading: THREE.FlatShading });
	var wheelTireR = new THREE.Mesh(wheelTireGeom, wheelTireMat);
	wheelTireR.position.set(25, -28, 25);

	var wheelAxisGeom = new THREE.BoxGeometry(10, 10, 6);
	var wheelAxisMat = new THREE.MeshPhongMaterial({ color: Colors.brown, shading: THREE.FlatShading });
	var wheelAxis = new THREE.Mesh(wheelAxisGeom, wheelAxisMat);
	wheelTireR.add(wheelAxis);

	this.mesh.add(wheelTireR);

	var wheelProtecL = wheelProtecR.clone();
	wheelProtecL.position.z = -wheelProtecR.position.z;
	this.mesh.add(wheelProtecL);

	var wheelTireL = wheelTireR.clone();
	wheelTireL.position.z = -wheelTireR.position.z;
	this.mesh.add(wheelTireL);

	var wheelTireB = wheelTireR.clone();
	wheelTireB.scale.set(.5, .5, .5);
	wheelTireB.position.set(-35, -5, 0);
	this.mesh.add(wheelTireB);

	var suspensionGeom = new THREE.BoxGeometry(4, 20, 4);
	suspensionGeom.applyMatrix(new THREE.Matrix4().makeTranslation(0, 10, 0))
	var suspensionMat = new THREE.MeshPhongMaterial({ color: Colors.red, shading: THREE.FlatShading });
	var suspension = new THREE.Mesh(suspensionGeom, suspensionMat);
	suspension.position.set(-35, -5, 0);
	suspension.rotation.z = -.3;
	this.mesh.add(suspension);
};

var Fox = function () {

	this.mesh = new THREE.Object3D();

	var redFurMat = new THREE.MeshPhongMaterial({ color: Colors.red, shading: THREE.FlatShading });

	// Create the Body
	var geomBody = new THREE.BoxGeometry(100, 50, 50, 1, 1, 1);
	var body = new THREE.Mesh(geomBody, redFurMat);
	body.castShadow = true;
	body.receiveShadow = true;
	this.mesh.add(body);

	// Create the Chest
	var geomChest = new THREE.BoxGeometry(50, 60, 70, 1, 1, 1);
	var chest = new THREE.Mesh(geomChest, redFurMat);
	chest.position.x = 60;
	chest.castShadow = true;
	chest.receiveShadow = true;
	this.mesh.add(chest);

	// Create the Head
	var geomHead = new THREE.BoxGeometry(40, 55, 50, 1, 1, 1);
	this.head = new THREE.Mesh(geomHead, redFurMat);
	this.head.position.set(80, 35, 0);
	this.head.castShadow = true;
	this.head.receiveShadow = true;

	// Create the Snout
	var geomSnout = new THREE.BoxGeometry(40, 30, 30, 1, 1, 1);
	var snout = new THREE.Mesh(geomSnout, redFurMat);
	geomSnout.vertices[ 0 ].y -= 5;
	geomSnout.vertices[ 0 ].z += 5;
	geomSnout.vertices[ 1 ].y -= 5;
	geomSnout.vertices[ 1 ].z -= 5;
	geomSnout.vertices[ 2 ].y += 5;
	geomSnout.vertices[ 2 ].z += 5;
	geomSnout.vertices[ 3 ].y += 5;
	geomSnout.vertices[ 3 ].z -= 5;
	snout.castShadow = true;
	snout.receiveShadow = true;
	snout.position.set(30, 0, 0);
	this.head.add(snout);

	// Create the Nose
	var geomNose = new THREE.BoxGeometry(10, 15, 20, 1, 1, 1);
	var matNose = new THREE.MeshPhongMaterial({ color: Colors.brown, shading: THREE.FlatShading });
	var nose = new THREE.Mesh(geomNose, matNose);
	nose.position.set(55, 0, 0);
	this.head.add(nose);

	// Create the Ears
	var geomEar = new THREE.BoxGeometry(10, 40, 30, 1, 1, 1);
	var earL = new THREE.Mesh(geomEar, redFurMat);
	earL.position.set(-10, 40, -18);
	this.head.add(earL);
	earL.rotation.x = -Math.PI / 10;
	geomEar.vertices[ 1 ].z += 5;
	geomEar.vertices[ 4 ].z += 5;
	geomEar.vertices[ 0 ].z -= 5;
	geomEar.vertices[ 5 ].z -= 5;

	// Create the Ear Tips
	var geomEarTipL = new THREE.BoxGeometry(10, 10, 20, 1, 1, 1);
	var matEarTip = new THREE.MeshPhongMaterial({ color: Colors.white, shading: THREE.FlatShading });
	var earTipL = new THREE.Mesh(geomEarTipL, matEarTip);
	earTipL.position.set(0, 25, 0);
	earL.add(earTipL);

	var earR = earL.clone();
	earR.position.z = -earL.position.z;
	earR.rotation.x = -	earL.rotation.x;
	this.head.add(earR);

	this.mesh.add(this.head);


	// Create the tail
	var geomTail = new THREE.BoxGeometry(80, 40, 40, 2, 1, 1);
	geomTail.vertices[ 4 ].y -= 10;
	geomTail.vertices[ 4 ].z += 10;
	geomTail.vertices[ 5 ].y -= 10;
	geomTail.vertices[ 5 ].z -= 10;
	geomTail.vertices[ 6 ].y += 10;
	geomTail.vertices[ 6 ].z += 10;
	geomTail.vertices[ 7 ].y += 10;
	geomTail.vertices[ 7 ].z -= 10;
	this.tail = new THREE.Mesh(geomTail, redFurMat);
	this.tail.castShadow = true;
	this.tail.receiveShadow = true;

	// Create the tail Tip
	var geomTailTip = new THREE.BoxGeometry(20, 40, 40, 1, 1, 1);
	var matTailTip = new THREE.MeshPhongMaterial({ color: Colors.white, shading: THREE.FlatShading });
	var tailTip = new THREE.Mesh(geomTailTip, matTailTip);
	tailTip.position.set(80, 0, 0);
	tailTip.castShadow = true;
	tailTip.receiveShadow = true;
	this.tail.add(tailTip);
	this.tail.position.set(-40, 10, 0);
	geomTail.translate(40, 0, 0);
	geomTailTip.translate(10, 0, 0);
	this.tail.rotation.z = Math.PI / 1.5;
	this.mesh.add(this.tail);


	// Create the Legs
	var geomLeg = new THREE.BoxGeometry(20, 60, 20, 1, 1, 1);
	this.legFR = new THREE.Mesh(geomLeg, redFurMat);
	this.legFR.castShadow = true;
	this.legFR.receiveShadow = true;

	// Create the feet
	var geomFeet = new THREE.BoxGeometry(20, 20, 20, 1, 1, 1);
	var matFeet = new THREE.MeshPhongMaterial({ color: Colors.white, shading: THREE.FlatShading });
	var feet = new THREE.Mesh(geomFeet, matFeet);
	feet.position.set(0, 0, 0);
	feet.castShadow = true;
	feet.receiveShadow = true;
	this.legFR.add(feet);
	this.legFR.position.set(70, -12, 25);
	geomLeg.translate(0, 40, 0);
	geomFeet.translate(0, 80, 0);
	this.legFR.rotation.z = 16;
	this.mesh.add(this.legFR);

	this.legFL = this.legFR.clone();
	this.legFL.position.z = -this.legFR.position.z;
	this.legFL.rotation.z = -this.legFR.rotation.z;
	this.mesh.add(this.legFL);

	this.legBR = this.legFR.clone();
	this.legBR.position.x = -(this.legFR.position.x) + 50;
	this.legBR.rotation.z = -this.legFR.rotation.z;
	this.mesh.add(this.legBR);

	this.legBL = this.legFL.clone();
	this.legBL.position.x = -(this.legFL.position.x) + 50;
	this.legBL.rotation.z = -this.legFL.rotation.z;
	this.mesh.add(this.legBL);

};


var sky;
var forest;
var land;
var orbit;
var airplane;
var sun;
var fox;

var mousePos = { x: 0, y: 0 };
var offSet = -600;
var isPaused = false;

function createSky() {
	sky = new Sky();
	sky.mesh.position.y = offSet;
	scene.add(sky.mesh);
}

function createLand() {
	land = new Land();
	land.mesh.position.y = offSet;
	scene.add(land.mesh);
}

function createOrbit() {
	orbit = new Orbit();
	orbit.mesh.position.y = offSet;
	orbit.mesh.rotation.z = -Math.PI / 6;
	scene.add(orbit.mesh);
}

function createForest() {
	forest = new Forest();
	forest.mesh.position.y = offSet;
	scene.add(forest.mesh);
}

function createSun() {
	sun = new Sun();
	sun.mesh.scale.set(1, 1, .3);
	sun.mesh.position.set(0, -30, -850);
	scene.add(sun.mesh);
}


function createPlane() {
	airplane = new AirPlane();
	airplane.mesh.scale.set(.35, .35, .35);
	airplane.mesh.position.set(-40, 110, -250);
	// airplane.mesh.rotation.z = Math.PI/15;
	scene.add(airplane.mesh);
}

function createFox() {
	fox = new Fox();
	fox.mesh.scale.set(.35, .35, .35);
	fox.mesh.position.set(-40, 110, -250);
	scene.add(fox.mesh);
}


function updatePlane() {
	if (isPaused) return; // Skip update if game is paused

	var targetY = normalize(mousePos.y, -.75, .75, 50, 190);
	var targetX = normalize(mousePos.x, -.75, .75, -100, -20);

	// Move the plane at each frame by adding a fraction of the remaining distance
	airplane.mesh.position.y += (targetY - airplane.mesh.position.y) * 0.1;

	airplane.mesh.position.x += (targetX - airplane.mesh.position.x) * 0.1;

	// Rotate the plane proportionally to the remaining distance
	airplane.mesh.rotation.z = (targetY - airplane.mesh.position.y) * 0.0128;
	airplane.mesh.rotation.x = (airplane.mesh.position.y - targetY) * 0.0064;
	airplane.mesh.rotation.y = (airplane.mesh.position.x - targetX) * 0.0064;

	airplane.propeller.rotation.x += 0.3;
}

function normalize(v, vmin, vmax, tmin, tmax) {

	var nv = Math.max(Math.min(v, vmax), vmin);
	var dv = vmax - vmin;
	var pc = (nv - vmin) / dv;
	var dt = tmax - tmin;
	var tv = tmin + (pc * dt);
	return tv;

}


function loop() {
	if (!isPaused) {
		land.mesh.rotation.z += .001;
		orbit.mesh.rotation.z += .0002;
		sky.mesh.rotation.z += .0007;
		forest.mesh.rotation.z += .001;
	}

	updatePlane();
	renderer.render(scene, camera);
	requestAnimationFrame(loop);
}

function handleMouseMove(event) {
	var tx = -1 + (event.clientX / WIDTH) * 2;
	var ty = 1 - (event.clientY / HEIGHT) * 2;
	mousePos = { x: tx, y: ty };
}

// Add touch event handler for mobile
function handleTouchMove(event) {
	if (event.touches.length > 0) {
		event.preventDefault();
		var tx = -1 + (event.touches[ 0 ].clientX / WIDTH) * 2;
		var ty = 1 - (event.touches[ 0 ].clientY / HEIGHT) * 2;
		mousePos = { x: tx, y: ty };
	}
}

function init(event) {
	createScene();
	createLights();
	createPlane();
	createOrbit();
	createSun();
	createLand();
	createForest();
	createSky();
	// createFox();

	// Add both mouse and touch event listeners
	document.addEventListener('mousemove', handleMouseMove, false);
	document.addEventListener('touchmove', handleTouchMove, { passive: false });

	// Load images from API
	updateImageGallery().then(() => {
		// Sau khi tải xong danh sách ảnh, tạo lại Sky để hiển thị ảnh
		if (sky && sky.mesh) {
			scene.remove(sky.mesh);
			createSky();
		}
	});

	// Make functions available globally to fix connection issues
	window.openUploadWidget = openUploadWidget;
	window.downloadAndUploadToCloudinary = downloadAndUploadToCloudinary;
	window.showNotification = showNotification;
	window.toggleUploadInterface = toggleUploadInterface;

	// Thêm sự kiện cho nút upload và download
	setupEventListeners();

	// Add pause functionality
	document.addEventListener('keydown', function (event) {
		if (event.code === 'Space') {
			isPaused = !isPaused;
			showNotification(isPaused ? 'Game Paused' : 'Game Resumed');
		}
	});

	setupImageZoom();

	loop();
}

// Setup event listeners for the buttons in a centralized function
function setupEventListeners() {
	const uploadBtn = document.getElementById('upload-btn');
	if (uploadBtn) {
		uploadBtn.addEventListener('click', function () {
			openUploadWidget();
		});
	}

	const toggleBtn = document.getElementById('toggle-upload-btn');
	if (toggleBtn) {
		toggleBtn.addEventListener('click', function () {
			const mailPopup = document.getElementById('mail-popup');
			if (mailPopup && mailPopup.classList.contains('active')) {
				const handleMailPopup = window.handleMailPopup;
				if (typeof handleMailPopup === 'function') {
					handleMailPopup();
				}
			}
			toggleUploadInterface();
		});
	}

	const downloadBtn = document.getElementById('download-btn');
	if (downloadBtn) {
		downloadBtn.addEventListener('click', function () {
			const urlInput = document.getElementById('image-url-input');
			if (urlInput) {
				const url = urlInput.value.trim();
				if (url) {
					downloadAndUploadToCloudinary(url);
					urlInput.value = '';
				} else {
					showNotification('Vui lòng nhập đường dẫn ảnh!', true);
				}
			}
		});
	}
}

// Check if mobile device and adjust scene if needed
function isMobile() {
	return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 600;
}

// Optimize for mobile if needed
if (isMobile()) {
	// Reduce number of clouds and trees for better performance on mobile
	Sky.prototype.nClouds = 30;
	Forest.prototype.nTrees = 150;
	Forest.prototype.nFlowers = 175;
}

window.addEventListener('load', init, false);

// Hàm cập nhật Sky để hiển thị ảnh mới
function updateSky() {
	// Tạo một đám mây mới có chứa ảnh mới nhất
	if (imagePaths.length > 0) {
		var newCloud = new Cloud();
		// Đặt đám mây ở vị trí hiển thị rõ ràng
		var angle = Math.random() * Math.PI * 2;
		var h = 725 + Math.random() * 200;
		newCloud.mesh.position.y = Math.sin(angle) * h;
		newCloud.mesh.position.x = Math.cos(angle) * h;
		newCloud.mesh.rotation.z = angle + Math.PI / 2;
		newCloud.mesh.position.z = -200 - Math.random() * 200;

		// Thêm đám mây mới vào sky
		if (sky && sky.mesh) {
			sky.mesh.add(newCloud.mesh);
		}
	}
}

// Music Player
let currentTrack = null;
let isPlaying = false;
let audioPlayer = new Audio();

// Update progress bar as audio plays
audioPlayer.addEventListener('timeupdate', () => {
	const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
	document.getElementById('progress-bar').style.width = `${progress}%`;
});

// Handle track end
audioPlayer.addEventListener('ended', () => {
	playNextTrack();
});

function toggleMusicPlayer() {
	const player = document.getElementById('music-player');
	player.classList.toggle('active');
}

async function loadPlaylist() {
	try {
		const tracks = await api.getAudioTracks();
		const playlist = document.getElementById('playlist');
		playlist.innerHTML = '';

		if (tracks.length === 0) {
			// playlist.innerHTML = '<div class="empty-playlist">Chưa có bài hát nào</div>';
			return;
		}

		tracks.forEach(track => {
			const item = document.createElement('div');
			item.className = 'playlist-item';
			if (currentTrack && track.id === currentTrack.id) {
				item.classList.add('active');
			}

			item.innerHTML = `
                <div>
                    <div>${track.title}</div>
                    <small>${track.artist}</small>
                </div>
                <div class="track-controls">
                    <button class="delete-track-btn" title="Xóa bài hát">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;

			// Play track on click
			item.querySelector('div:first-child').addEventListener('click', () => playTrack(track));

			// Delete track button
			const deleteBtn = item.querySelector('.delete-track-btn');
			if (deleteBtn) {
				deleteBtn.addEventListener('click', (e) => {
					e.stopPropagation();
					deleteTrack(track.id);
				});
			}

			playlist.appendChild(item);
		});

		// Auto-play the first track if available but with a delay to ensure DOM is ready
		if (tracks.length > 0 && !currentTrack) {
			setTimeout(() => {
				playTrack(tracks[ 0 ]);
				toggleMusicPlayer(); // Open the player
			}, 1000);
		}
	} catch (error) {
		console.error('Error loading playlist:', error);
		showNotification('Không thể tải danh sách nhạc', true);
	}
}

function playTrack(track) {
	currentTrack = track;

	// Check if the track is a YouTube video
	if (track.url.includes('youtube.com/embed')) {
		// Handle YouTube embeds
		const playerContainer = document.getElementById('music-player');
		const oldPlayer = playerContainer.querySelector('iframe');
		const controlsContainer = document.querySelector('.controls');
		const progressContainer = document.getElementById('progress-container');

		if (oldPlayer) oldPlayer.remove();

		// Hide controls and progress bar for embedded players
		if (controlsContainer) controlsContainer.style.display = 'none';
		if (progressContainer) progressContainer.style.display = 'none';

		// Create YouTube iframe player
		const iframe = document.createElement('iframe');
		iframe.src = track.url;
		iframe.width = "100%";
		iframe.height = "180";
		iframe.scrolling = "no";
		iframe.frameBorder = "0";
		iframe.allow = "autoplay; encrypted-media";
		iframe.allowFullscreen = true;
		iframe.style.display = 'block';
		iframe.style.marginTop = '10px';
		iframe.style.borderRadius = '8px';
		iframe.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';

		// Add iframe to player container after the track info
		const trackInfo = playerContainer.querySelector('.track-info');
		if (trackInfo) {
			trackInfo.insertAdjacentElement('afterend', iframe);
		} else {
			playerContainer.appendChild(iframe);
		}
		isPlaying = true;
	} else if (track.url.includes('zingmp3.vn/embed')) {
		// ...existing code for ZingMP3 players...
	} else {
		// ...existing code for regular audio files...
	}

	updatePlayerUI();
}

function updatePlayerUI() {
	const playBtn = document.getElementById('play-btn');
	const trackTitle = document.querySelector('.track-title');
	const trackArtist = document.querySelector('.track-artist');

	if (currentTrack) {
		trackTitle.textContent = currentTrack.title;
		trackArtist.textContent = currentTrack.artist;

		// Only update play button for regular audio tracks
		if (!currentTrack.url.includes('zingmp3.vn/embed')) {
			playBtn.innerHTML = isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
		}
	}
}

function togglePlay() {
	// Don't try to control embedded players
	if (!currentTrack || currentTrack.url.includes('zingmp3.vn/embed')) return;

	if (isPlaying) {
		audioPlayer.pause();
	} else {
		audioPlayer.play().catch(err => {
			console.error('Error playing audio:', err);
			showNotification('Không thể phát nhạc. Nhấn lại để thử lại.', true);
		});
	}
	isPlaying = !isPlaying;
	updatePlayerUI();
}

// Add event listeners
document.addEventListener('DOMContentLoaded', () => {
	// Music player controls
	document.getElementById('music-toggle-btn').onclick = toggleMusicPlayer;
	document.getElementById('play-btn').onclick = togglePlay;
	document.getElementById('prev-btn').onclick = playPreviousTrack;
	document.getElementById('next-btn').onclick = playNextTrack;
	document.getElementById('add-track-btn').onclick = showAddTrackDialog;

	// Load initial playlist with autoplay
	loadPlaylist();

	// Add interaction event to enable autoplay after user interacts with page
	document.addEventListener('click', function enableAutoplay() {
		audioPlayer.play().then(() => {
			audioPlayer.pause();
			// Remove the listener after first interaction
			document.removeEventListener('click', enableAutoplay);
		}).catch(() => {/* ignore errors */ });
	}, { once: true });
});

// Music Player Functions
async function playPreviousTrack() {
	try {
		const tracks = await api.getAudioTracks();
		if (!tracks.length) return;

		const currentIndex = tracks.findIndex(t => t.id === currentTrack?.id);
		const prevIndex = currentIndex <= 0 ? tracks.length - 1 : currentIndex - 1;
		playTrack(tracks[ prevIndex ]);
	} catch (error) {
		console.error('Error playing previous track:', error);
		showNotification('Error playing previous track', true);
	}
}

async function playNextTrack() {
	try {
		const tracks = await api.getAudioTracks();
		if (!tracks.length) return;

		const currentIndex = tracks.findIndex(t => t.id === currentTrack?.id);
		const nextIndex = currentIndex >= tracks.length - 1 ? 0 : currentIndex + 1;
		playTrack(tracks[ nextIndex ]);
	} catch (error) {
		console.error('Error playing next track:', error);
		showNotification('Error playing next track', true);
	}
}

// Function to fetch YouTube video title
async function getYouTubeVideoTitle(videoId) {
	try {
		// Method 1: Use oEmbed API (doesn't require API key)
		const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);

		if (response.ok) {
			const data = await response.json();
			return data.title;
		} else {
			console.warn('Could not fetch YouTube title, falling back to video ID');
			return null;
		}
	} catch (error) {
		console.error('Error fetching YouTube video title:', error);
		return null;
	}
}

function showAddTrackDialog() {
	const dialog = document.createElement('div');
	dialog.className = 'add-track-dialog';
	dialog.innerHTML = `
    <div class="dialog-content">
      
      <div class="input-group">
        <label>URL video YouTube:</label>
        <input type="text" id="youtube-url" 
          placeholder="https://www.youtube.com/watch?v=..."
          style="width: 100%; margin-top: 8px; padding: 8px;">
      </div>
      
      <div id="error-message" style="color: red; margin-top: 10px; display: none;"></div>
      
      <div class="dialog-buttons">
        <button class="cancel-btn">Hủy</button>
        <button class="save-btn">Thêm</button>
      </div>
    </div>`;

	document.body.appendChild(dialog);

	const saveTrack = async () => {
		const errorMsg = document.getElementById('error-message');
		errorMsg.style.display = 'none';

		const youtubeUrl = document.getElementById('youtube-url').value.trim();

		// Validate input
		if (!youtubeUrl) {
			errorMsg.textContent = 'Vui lòng nhập URL YouTube';
			errorMsg.style.display = 'block';
			return;
		}

		try {
			// YouTube processing
			let videoId;
			if (youtubeUrl.includes('youtube.com/watch?v=')) {
				const url = new URL(youtubeUrl);
				videoId = url.searchParams.get('v');
			} else if (youtubeUrl.includes('youtu.be/')) {
				videoId = youtubeUrl.split('youtu.be/')[ 1 ].split('?')[ 0 ];
			} else if (youtubeUrl.includes('youtube.com/embed/')) {
				videoId = youtubeUrl.split('youtube.com/embed/')[ 1 ].split('?')[ 0 ];
			} else {
				throw new Error('URL YouTube không hợp lệ');
			}

			if (!videoId) throw new Error('Không thể xác định ID video YouTube');

			// Show loading notification
			showNotification('Đang tải thông tin video...');

			// Get the actual video title
			const videoTitle = await getYouTubeVideoTitle(videoId);

			const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
			const title = videoTitle || `YouTube Video (${videoId})`;

			// Create track data object
			const trackData = {
				url: embedUrl,
				title: title,
				artist: 'YouTube',
				type: 'youtube'
			};

			console.log('Adding YouTube video:', trackData);

			const result = await api.addAudioTrack(trackData);

			await loadPlaylist();
			showNotification('Đã thêm video YouTube thành công!');
			dialog.remove();

			// Play the added track immediately
			const tracks = await api.getAudioTracks();
			const newTrack = tracks.find(t => t.url === embedUrl);
			if (newTrack) {
				setTimeout(() => {
					playTrack(newTrack);
					toggleMusicPlayer(); // Open the player
				}, 500);
			}

		} catch (error) {
			console.error('Error adding YouTube video:', error);

			// Show specific error message
			let errorMessage = 'Lỗi khi thêm video: ';

			if (error.message.includes('URL YouTube không hợp lệ') || error.message.includes('Không thể xác định ID')) {
				errorMessage += 'URL YouTube không đúng định dạng. Hãy sử dụng URL dạng: https://www.youtube.com/watch?v=VIDEO_ID';
			} else if (error.message.includes('Network Error') || error.message.includes('Failed to fetch')) {
				errorMessage += 'Không thể kết nối tới máy chủ. Kiểm tra kết nối mạng của bạn.';
			} else {
				errorMessage += error.message || 'Vui lòng thử lại.';
			}

			errorMsg.textContent = errorMessage;
			errorMsg.style.display = 'block';
		}
	};

	dialog.querySelector('.save-btn').onclick = saveTrack;
	dialog.querySelector('.cancel-btn').onclick = () => dialog.remove();

	// Add Enter key support
	const youtubeInput = dialog.querySelector('#youtube-url');
	youtubeInput.addEventListener('keypress', (e) => {
		if (e.key === 'Enter') saveTrack();
	});

	// Focus the input field
	setTimeout(() => youtubeInput.focus(), 100);
}

// Add the missing deleteTrack function
async function deleteTrack(id) {
	try {
		await api.deleteAudioTrack(id);
		await loadPlaylist();

		// If the deleted track is currently playing, play next track
		if (currentTrack && currentTrack.id === id) {
			const tracks = await api.getAudioTracks();
			if (tracks.length > 0) {
				playTrack(tracks[ 0 ]);
			} else {
				// No tracks left
				currentTrack = null;
				const playerContainer = document.getElementById('music-player');
				const iframe = playerContainer.querySelector('iframe');
				if (iframe) iframe.remove();

				document.querySelector('.track-title').textContent = 'No track selected';
				document.querySelector('.track-artist').textContent = '-';
			}
		}

		showNotification('Đã xóa bài hát!');
	} catch (error) {
		console.error('Error deleting track:', error);
		showNotification('Có lỗi khi xóa bài hát!', true);
	}
}

// Hàm tải nhiều ảnh theo tuần tự
async function downloadMultipleImagesSequentially(urls) {
	const total = urls.length;
	let processed = 0;
	let successful = 0;

	showNotification(`Đang tải: 0/${total} ảnh...`);

	for (const url of urls) {
		try {
			// Đánh dấu là batch upload để không refresh cho từng ảnh riêng lẻ
			const blob = await downloadImageAsBlob(url);
			const cloudinaryUrl = await uploadToCloudinary(blob);
			await addImagePath(cloudinaryUrl, false, true); // true cho isBatch
			successful++;
			processed++;
			showNotification(`Đang tải: ${processed}/${total} ảnh...`);
		} catch (error) {
			console.error('Error downloading image:', url, error);
			processed++;
			showNotification(`Đang tải: ${processed}/${total} ảnh... (${successful} thành công)`);
		}
	}

	const allSuccess = successful === total;
	showNotification(`Đã tải xong ${successful}/${total} ảnh thành công!`, !allSuccess);

	// Chỉ trả về true nếu tất cả ảnh đều tải thành công
	return successful > 0;
}

// Add image zoom functionality
function setupImageZoom() {
	const gallery = document.getElementById('image-gallery');
	if (!gallery) return;

	gallery.addEventListener('click', function (e) {
		// Check if the click was on the delete button or its icon
		if (e.target.closest('.delete-img-btn')) {
			// Don't zoom if delete button was clicked
			return;
		}

		const imgContainer = e.target.closest('.gallery-img-container');
		if (!imgContainer) return;

		const img = imgContainer.querySelector('img');
		if (!img) return;

		const modal = document.createElement('div');
		modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 2000;
            cursor: zoom-out;
        `;

		const zoomedImg = document.createElement('img');
		zoomedImg.src = img.src;
		zoomedImg.style.cssText = `
            max-width: 95%;
            max-height: 95%;
            object-fit: contain;
            border: 2px solid white;
            box-shadow: 0 0 20px rgba(0,0,0,0.5);
        `;

		modal.appendChild(zoomedImg);
		document.body.appendChild(modal);

		// Close modal on click
		modal.onclick = () => modal.remove();

		// Pause game when zooming
		isPaused = true;

		// Resume game when closing zoom
		modal.addEventListener('click', () => {
			isPaused = false;
			showNotification('Game Resumed');
		});
	});
}

// Function to reveal letter content with animation
function revealLetterContent() {
	const spans = document.querySelectorAll('.mail-popup .content span');
	spans.forEach((span, index) => {
		// Reset opacity first
		span.style.opacity = 0;

		setTimeout(() => {
			span.style.opacity = 1;
		}, index * 30); // Speed up animation a bit
	});

	// Mark animation as played
	localStorage.setItem('letterAnimationPlayed', 'true');
	window.hasAnimationPlayed = true;
	// Mark as authenticated for any code that might check this
	window.hasBeenAuthenticated = true;
}

// Replace the original handleMailPopup function with a simpler version (no password)
window.handleMailPopup = function () {
	const popup = document.getElementById('mail-popup');

	if (popup.classList.contains('active')) {
		// If letter is already open, close it
		popup.classList.remove('active');

		// Reset spans opacity for next opening
		const spans = document.querySelectorAll('.mail-popup .content span');
		spans.forEach(span => {
			span.style.opacity = 0;
		});
	} else {
		// If letter is closed, open it and reveal content (no password required)
		popup.classList.add('active');
		revealLetterContent();
	}
};

// Add close button functionality
document.addEventListener('DOMContentLoaded', function () {
	const closeBtn = document.querySelector('.mail-popup .close-btn');
	if (closeBtn) {
		closeBtn.addEventListener('click', function () {
			const popup = document.getElementById('mail-popup');
			popup.classList.remove('active');
		});
	}
});

// On DOMContentLoaded, override the handleMailPopup function in window
document.addEventListener('DOMContentLoaded', function () {
	// Ensure our implementation is active by overriding any other version
	window.handleMailPopup = function () {
		const popup = document.getElementById('mail-popup');

		if (popup.classList.contains('active')) {
			// If letter is already open, close it
			popup.classList.remove('active');

			// Reset spans opacity for next opening
			const spans = document.querySelectorAll('.mail-popup .content span');
			spans.forEach(span => {
				span.style.opacity = 0;
			});
		} else {
			// If letter is closed, open it and reveal content (no password required)
			popup.classList.add('active');
			revealLetterContent();
		}
	};

	// Also make sure the mail icon uses our version
	const mailIcon = document.getElementById('mail-icon');
	if (mailIcon) {
		// Remove any existing listeners by cloning the element
		const newMailIcon = mailIcon.cloneNode(true);
		mailIcon.parentNode.replaceChild(newMailIcon, mailIcon);

		// Add our handler
		newMailIcon.addEventListener('click', window.handleMailPopup);
	}
});

function zoomImage(imageSrc) {
	// ...existing code...
}