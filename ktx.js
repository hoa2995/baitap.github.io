//các biến toàn cầu
let selectedRoomId = null;
//hàm lấy dữ liệu từ server
async function fetchData() {
    //lấy danh sách tòa nhà và phòng từ server
    try {
        const buildingsResponse = await fetch('api.php?action=getBuildings');
        const roomsResponse = await fetch('api.php?action=getRooms');
        
        const buildings = await buildingsResponse.json();
        const rooms = await roomsResponse.json();
        
        updateBuildingSelect(buildings);
        renderRoomsByBuilding(buildings, rooms);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function updateBuildingSelect(buildings) {
    const select = document.getElementById('roomType');
    select.innerHTML = '';
    buildings.forEach(building => {
        const option = document.createElement('option');
        option.value = building.id;
        option.textContent = `Tòa ${building.name}`;
        select.appendChild(option);
    });
}

function renderRoomsByBuilding(buildings, rooms) {
    const roomGrid = document.getElementById('roomGrid');
    roomGrid.innerHTML = '';

    buildings.forEach(building => {
        const buildingSection = document.createElement('div');
        buildingSection.className = 'building-section';
        
        const buildingRooms = rooms.filter(room => room.building_id === building.id);
        
        buildingSection.innerHTML = `
            <h2 onclick="openEditBuilding(${building.id}, '${building.name}')" style="cursor: pointer;">
                Tòa ${building.name}
            </h2>
            <div class="building-rooms">
                ${buildingRooms.length ? 
                    buildingRooms.map(room => createRoomCard(room)).join('') :
                    '<div class="no-rooms">Chưa có phòng</div>'
                }
            </div>
        `;
        
        roomGrid.appendChild(buildingSection);
    });
}
//tạo card hiển thị thông tin phòng
function createRoomCard(room) {
    const canRegister = room.status === 'available' && room.current_occupants < room.max_occupants;
    
    return `
        <div class="room-card" data-room-id="${room.id}">
            <span class="room-status ${room.status}" data-status="${room.status}">
                ${getStatusText(room.status)}
            </span>
            <h3 class="room-number" onclick="showStudentList(${room.id})" style="cursor: pointer;">
                Phòng ${room.number}
            </h3>
            <p>Số người: ${room.current_occupants}/${room.max_occupants}</p>
            <p>Giá: ${formatPrice(room.price)}đ/học kỳ</p>
            <button onclick="openRegisterModal(${room.id})" 
                ${!canRegister ? 'disabled' : ''}>
                Đăng ký
            </button>
            <button class="edit-status-btn" onclick="openEditStatus(${room.id})">
                Sửa trạng thái
            </button>
        </div>
    `;
}
//hàm lấy text hiển thị trạng thái phòng
function getStatusText(status) {
    const statusMap = {
        'available': 'Còn trống',
        'occupied': 'Đã đủ người',
        'maintenance': 'Đang bảo trì',
        'repairs': 'Đang sửa chữa',
        'cleaning': 'Đang dọn dẹp',
        'damaged': 'Hỏng đồ đạc'
    };
    return statusMap[status] || status;
}
//hàm format giá tiền
function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN').format(price);
}
//hàm thêm phòng mới
async function addRoom(event) {
    event.preventDefault();
    
    const newRoom = {
        number: document.getElementById('roomNumber').value,
        building_id: document.getElementById('roomType').value,
        max_occupants: Number(document.getElementById('maxOccupants').value),
        price: Number(document.getElementById('roomPrice').value)
    };
    
    try {
        const response = await fetch('api.php?action=addRoom', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newRoom)
        });
        
        const result = await response.json();
        if (result.success) {
            await fetchData();
            closeAddRoom();
            document.getElementById('addRoomForm').reset();
        }
    } catch (error) {
        console.error('Error adding room:', error);
    }
}
//hàm thêm tòa nhà mới
async function addBuilding(event) {
    event.preventDefault();
    
    const buildingName = document.getElementById('buildingName').value;
    
    try {
        const response = await fetch('api.php?action=addBuilding', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: buildingName })
        });
        
        const result = await response.json();
        if (result.success) {
            await fetchData();
            closeAddBuilding();
            document.getElementById('addBuildingForm').reset();
        }
    } catch (error) {
        console.error('Error adding building:', error);
    }
}
//hàm đăng ký phòng cho sinh viên
async function submitRegistration(event) {
    event.preventDefault();
    
    const registration = {
        roomId: selectedRoomId,
        studentName: document.getElementById('studentName').value,
        studentId: document.getElementById('studentId').value,
        studentPhone: document.getElementById('studentPhone').value,
        studentEmail: document.getElementById('studentEmail').value,
        studentFaculty: document.getElementById('studentFaculty').value
    };
    
    try {
        const response = await fetch('api.php?action=addRegistration', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(registration)
        });
        
        const result = await response.json();
        if (result.success) {
            await fetchData();
            alert('Đăng ký phòng thành công!');
            closeRegisterModal();
        }
    } catch (error) {
        console.error('Error submitting registration:', error);
    }
}
//hàm cập nhật trạng thái phòng
async function updateRoomStatus(event) {
    event.preventDefault();
    
    const status = document.getElementById('roomStatus').value;
    
    try {
        const response = await fetch('api.php?action=updateRoomStatus', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                roomId: selectedRoomId,
                status: status
            })
        });
        
        const result = await response.json();
        if (result.success) {
            await fetchData();
            closeEditStatus();
        }
    } catch (error) {
        console.error('Error updating room status:', error);
    }
}
//hàm modal control
function openAddRoom() {
    document.getElementById('addRoomModal').style.display = 'block';
}

function closeAddRoom() {
    document.getElementById('addRoomModal').style.display = 'none';
}

function openAddBuilding() {
    document.getElementById('addBuildingModal').style.display = 'block';
}

function closeAddBuilding() {
    document.getElementById('addBuildingModal').style.display = 'none';
}

function openRegisterModal(roomId) {
    selectedRoomId = roomId;
    document.getElementById('registerModal').style.display = 'block';
}

function closeRegisterModal() {
    document.getElementById('registerModal').style.display = 'none';
    document.getElementById('registerForm').reset();
}

function openEditStatus(roomId) {
    selectedRoomId = roomId;
    document.getElementById('editStatusModal').style.display = 'block';
    
    const roomCard = document.querySelector(`[data-room-id="${roomId}"]`);
    if (roomCard) {
        const currentStatus = roomCard.querySelector('.room-status').dataset.status;
        document.getElementById('roomStatus').value = currentStatus;
    }
}

function closeEditStatus() {
    document.getElementById('editStatusModal').style.display = 'none';
}
//hàm hiển thị danh sách sinh viên trong phòng
async function showStudentList(roomId) {
    try {
        const response = await fetch(`api.php?action=getStudents&roomId=${roomId}`);
        const students = await response.json();
        
        const container = document.getElementById('studentListContainer');
        
        if (students.length === 0) {
            container.innerHTML = '<div class="no-students">Chưa có sinh viên đăng ký phòng này</div>';
        } else {
            container.innerHTML = students.map(student => `
                <div class="student-list-item">
                    <p><strong>Họ và tên:</strong> ${student.student_name}</p>
                    <p><strong>MSSV:</strong> ${student.student_id}</p>
                    <p><strong>SĐT:</strong> ${student.student_phone}</p>
                    <p><strong>Email:</strong> ${student.student_email}</p>
                    <p><strong>Khoa:</strong> ${student.student_faculty}</p>
                    <p><strong>Ngày đăng ký:</strong> ${new Date(student.registration_date).toLocaleDateString('vi-VN')}</p>
                </div>
            `).join('');
        }
        
        // Hiển thị modal
        document.getElementById('studentListModal').style.display = 'block';
    } catch (error) {
        console.error('Error fetching students:', error);
        alert('Có lỗi xảy ra khi lấy danh sách sinh viên');
    }
}
//hàm đóng modal danh sách sinh viên
function closeStudentList() {
    document.getElementById('studentListModal').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', function() {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'true') {
        document.body.classList.add('dark-mode');
    }
    
    fetchData();
});
//hàm tìm kiếm phòng
async function searchRooms() {
    const searchText = document.getElementById('searchInput').value.toLowerCase().trim();
    
    if (!searchText) {
        await fetchData();
        return;
    }

    try {
        const buildingsResponse = await fetch('api.php?action=getBuildings');
        const roomsResponse = await fetch('api.php?action=getRooms');
        const studentsResponse = await fetch('api.php?action=getAllStudents');
        
        const buildings = await buildingsResponse.json();
        const rooms = await roomsResponse.json();
        const students = await studentsResponse.json();

        // Lọc phòng dựa trên các tiêu chí
        const filteredRooms = rooms.filter(room => {
            const building = buildings.find(b => b.id === room.building_id);
            const roomStudents = students.filter(s => s.room_id === room.id);
            
            // Tìm trong số phòng
            const matchRoom = room.number.toString().toLowerCase().includes(searchText);
            
            // Tìm trong tên tòa nhà - Đã sửa lại phần này
            const matchBuilding = building && (
                building.name.toLowerCase().includes(searchText) ||           // Tìm theo tên tòa
                `tòa ${building.name}`.toLowerCase().includes(searchText) || // Tìm theo "tòa X"
                `toa ${building.name}`.toLowerCase().includes(searchText) || // Tìm theo "toa X"
                `toà ${building.name}`.toLowerCase().includes(searchText)    // Tìm theo "toà X"
            );
            
            // Tìm trong thông tin sinh viên
            const matchStudent = roomStudents.some(student => 
                student.student_name.toLowerCase().includes(searchText) ||
                student.student_id.toLowerCase().includes(searchText) ||
                student.student_phone.toLowerCase().includes(searchText) ||
                student.student_email.toLowerCase().includes(searchText) ||
                student.student_faculty.toLowerCase().includes(searchText)
            );

            return matchRoom || matchBuilding || matchStudent;
        });

        // Render kết quả
        renderRoomsByBuilding(buildings, filteredRooms);

    } catch (error) {
        console.error('Error searching:', error);
    }
}

// Hàm khởi tạo khi trang load
document.addEventListener('DOMContentLoaded', function() {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'true') {
        document.body.classList.add('dark-mode');
    }
    fetchData();
});

// Chức năng Dark Mode
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

// Chức năng tìm kiếm
async function searchRooms() {
    const searchText = document.getElementById('searchInput').value.toLowerCase().trim();
    
    if (!searchText) {
        await fetchData();
        return;
    }

    try {
        const buildingsResponse = await fetch('api.php?action=getBuildings');
        const roomsResponse = await fetch('api.php?action=getRooms');
        const studentsResponse = await fetch('api.php?action=getAllStudents');
        
        const buildings = await buildingsResponse.json();
        const rooms = await roomsResponse.json();
        const students = await studentsResponse.json();

        const filteredRooms = rooms.filter(room => {
            const building = buildings.find(b => b.id === room.building_id);
            const roomStudents = students.filter(s => s.room_id === room.id);
            
            return room.number.toLowerCase().includes(searchText) ||
                   `tòa ${building?.name}`.toLowerCase().includes(searchText) ||
                   roomStudents.some(student => 
                       student.student_name.toLowerCase().includes(searchText) ||
                       student.student_id.toLowerCase().includes(searchText) ||
                       student.student_email.toLowerCase().includes(searchText) ||
                       student.student_faculty.toLowerCase().includes(searchText)
                   );
        });

        renderRoomsByBuilding(buildings, filteredRooms);
    } catch (error) {
        console.error('Error searching:', error);
    }
}

// Chức năng lọc phòng
async function filterRooms(filter) {
    try {
        const roomGrid = document.getElementById('roomGrid');
        const registrationsList = document.getElementById('registrationsList');

        // Hiển thị grid phòng và ẩn danh sách đăng ký
        roomGrid.style.display = 'flex';
        registrationsList.style.display = 'none';

        const response = await fetch(`api.php?action=getRooms`);
        const rooms = await response.json();
        const buildingsResponse = await fetch('api.php?action=getBuildings');
        const buildings = await buildingsResponse.json();

        let filteredRooms = rooms;
        
        // Lọc phòng theo điều kiện
        if (filter !== 'all') {
            filteredRooms = rooms.filter(room => {
                if (filter === 'available') {
                    return room.status === 'available' && room.current_occupants < room.max_occupants;
                } else if (filter === 'occupied') {
                    return room.status === 'occupied' || room.current_occupants >= room.max_occupants;
                } else if (filter === 'issues') {
                    // Lọc các phòng có vấn đề
                    return ['maintenance', 'repairs', 'cleaning', 'damaged'].includes(room.status);
                }
                return true;
            });
        }

        renderRoomsByBuilding(buildings, filteredRooms);
    } catch (error) {
        console.error('Error filtering rooms:', error);
    }
}

// Chức năng xem danh sách đăng ký
async function showRegistrations() {
    try {
        const response = await fetch('api.php?action=getRegistrations');
        const registrations = await response.json();
        
        const container = document.getElementById('registrationsContainer');
        container.innerHTML = registrations.map(reg => `
            <div class="registration-item">
                <div>
                    <p><strong>Sinh viên:</strong> ${reg.student_name}</p>
                    <p><strong>MSSV:</strong> ${reg.student_id}</p>
                    <p><strong>Phòng:</strong> ${reg.room_number}</p>
                    <p><strong>Ngày đăng ký:</strong> ${new Date(reg.registration_date).toLocaleDateString('vi-VN')}</p>
                </div>
                <button class="cancel-registration" onclick="cancelRegistration(${reg.id})">Hủy đăng ký</button>
            </div>
        `).join('');
        
        document.getElementById('registrationsList').style.display = 'block';
        document.getElementById('roomGrid').style.display = 'none';
    } catch (error) {
        console.error('Error fetching registrations:', error);
    }
}

// Chức năng hủy đăng ký
async function cancelRegistration(registrationId) {
    if (!confirm('Bạn có chắc muốn hủy đăng ký này?')) return;
    
    try {
        const response = await fetch('api.php?action=cancelRegistration', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ registrationId })
        });
        
        const result = await response.json();
        if (result.success) {
            showRegistrations();
        }
    } catch (error) {
        console.error('Error canceling registration:', error);
    }
}

// Các hàm modal
function openAddRoom() {
    document.getElementById('addRoomModal').style.display = 'block';
}

function closeAddRoom() {
    document.getElementById('addRoomModal').style.display = 'none';
    document.getElementById('addRoomForm').reset();
}

function openAddBuilding() {
    document.getElementById('addBuildingModal').style.display = 'block';
}

function closeAddBuilding() {
    document.getElementById('addBuildingModal').style.display = 'none';
    document.getElementById('addBuildingForm').reset();
}

function openRegisterModal(roomId) {
    selectedRoomId = roomId;
    document.getElementById('registerModal').style.display = 'block';
}

function closeRegisterModal() {
    document.getElementById('registerModal').style.display = 'none';
    document.getElementById('registerForm').reset();
}

function openEditStatus(roomId) {
    selectedRoomId = roomId;
    document.getElementById('editStatusModal').style.display = 'block';
    
    const roomCard = document.querySelector(`[data-room-id="${roomId}"]`);
    if (roomCard) {
        const currentStatus = roomCard.querySelector('.room-status').dataset.status;
        document.getElementById('roomStatus').value = currentStatus;
    }
}

function closeEditStatus() {
    document.getElementById('editStatusModal').style.display = 'none';
}

// Chức năng xem danh sách sinh viên trong phòng
async function showStudentList(roomId) {
    try {
        const response = await fetch(`api.php?action=getStudents&roomId=${roomId}`);
        const students = await response.json();
        
        const container = document.getElementById('studentListContainer');
        
        if (students.length === 0) {
            container.innerHTML = '<div class="no-students">Chưa có sinh viên đăng ký phòng này</div>';
        } else {
            container.innerHTML = students.map(student => `
                <div class="student-list-item">
                    <p><strong>Họ và tên:</strong> ${student.student_name}</p>
                    <p><strong>MSSV:</strong> ${student.student_id}</p>
                    <p><strong>SĐT:</strong> ${student.student_phone}</p>
                    <p><strong>Email:</strong> ${student.student_email}</p>
                    <p><strong>Khoa:</strong> ${student.student_faculty}</p>
                    <p><strong>Ngày đăng ký:</strong> ${new Date(student.registration_date).toLocaleDateString('vi-VN')}</p>
                </div>
            `).join('');
        }
        
        // Hiển thị modal
        document.getElementById('studentListModal').style.display = 'block';
    } catch (error) {
        console.error('Error fetching students:', error);
        alert('Có lỗi xảy ra khi lấy danh sách sinh viên');
    }
}

function closeStudentList() {
    document.getElementById('studentListModal').style.display = 'none';
}

// Các hàm xử lý form
async function addRoom(event) {
    event.preventDefault();
    
    const newRoom = {
        number: document.getElementById('roomNumber').value,
        building_id: document.getElementById('roomType').value,
        max_occupants: Number(document.getElementById('maxOccupants').value),
        price: Number(document.getElementById('roomPrice').value)
    };
    
    try {
        const response = await fetch('api.php?action=addRoom', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newRoom)
        });
        
        const result = await response.json();
        if (result.success) {
            await fetchData();
            closeAddRoom();
        }
    } catch (error) {
        console.error('Error adding room:', error);
    }
}
async function addBuilding(event) {
    event.preventDefault();
    
    const buildingName = document.getElementById('buildingName').value;
    
    try {
        const response = await fetch('api.php?action=addBuilding', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: buildingName })
        });
        
        const result = await response.json();
        if (result.success) {
            await fetchData();
            closeAddBuilding();
        }
    } catch (error) {
        console.error('Error adding building:', error);
    }
}

async function submitRegistration(event) {
    event.preventDefault();
    
    const registration = {
        roomId: selectedRoomId,
        studentName: document.getElementById('studentName').value,
        studentId: document.getElementById('studentId').value,
        studentPhone: document.getElementById('studentPhone').value,
        studentEmail: document.getElementById('studentEmail').value,
        studentFaculty: document.getElementById('studentFaculty').value
    };
    
    try {
        const response = await fetch('api.php?action=addRegistration', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registration)
        });
        
        const result = await response.json();
        if (result.success) {
            await fetchData();
            alert('Đăng ký phòng thành công!');
            closeRegisterModal();
        }
    } catch (error) {
        console.error('Error submitting registration:', error);
    }
}

async function updateRoomStatus(event) {
    event.preventDefault();
    
    const status = document.getElementById('roomStatus').value;
    
    try {
        const response = await fetch('api.php?action=updateRoomStatus', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                roomId: selectedRoomId,
                status: status
            })
        });
        
        const result = await response.json();
        if (result.success) {
            await fetchData();
            closeEditStatus();
        }
    } catch (error) {
        console.error('Error updating room status:', error);
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const hamburgerMenu = document.querySelector('.hamburger-menu');
    sidebar.classList.toggle('open');
    
    // Ẩn/hiện nút hamburger menu
    if (sidebar.classList.contains('open')) {
        hamburgerMenu.style.display = 'none';
    } else {
        hamburgerMenu.style.display = 'flex';
    }
}

// Đóng sidebar khi click ra ngoài
document.addEventListener('click', function(event) {
    const sidebar = document.getElementById('sidebar');
    const hamburgerMenu = document.querySelector('.hamburger-menu');
    
    if (!sidebar.contains(event.target) && 
        !hamburgerMenu.contains(event.target) && 
        sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
        hamburgerMenu.style.display = 'flex';
    }
});

function openEditBuilding(buildingId, buildingName) {
    document.getElementById('editBuildingId').value = buildingId;
    document.getElementById('editBuildingName').value = buildingName;
    document.getElementById('editBuildingModal').style.display = 'block';
}

function closeEditBuilding() {
    document.getElementById('editBuildingModal').style.display = 'none';
    document.getElementById('editBuildingForm').reset();
}

async function updateBuilding(event) {
    event.preventDefault();
    
    const buildingId = document.getElementById('editBuildingId').value;
    const buildingName = document.getElementById('editBuildingName').value;
    
    try {
        const response = await fetch('api.php?action=updateBuilding', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: buildingId,
                name: buildingName
            })
        });
        
        const result = await response.json();
        if (result.success) {
            await fetchData();
            closeEditBuilding();
        } else {
            alert('Không thể cập nhật tòa nhà: ' + result.error);
        }
    } catch (error) {
        console.error('Error updating building:', error);
        alert('Có lỗi xảy ra khi cập nhật tòa nhà');
    }
}
//hàm xóa tòa nhà
async function deleteBuilding() {
    if (!confirm('Bạn có chắc muốn xóa tòa nhà này? Tất cả phòng và đăng ký trong tòa nhà sẽ bị xóa.')) {
        return;
    }
    
    const buildingId = document.getElementById('editBuildingId').value;
    
    try {
        const response = await fetch('api.php?action=deleteBuilding', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: buildingId })
        });
        
        const result = await response.json();
        if (result.success) {
            await fetchData();
            closeEditBuilding();
        } else {
            alert(result.error || 'Không thể xóa tòa nhà');
        }
    } catch (error) {
        console.error('Error deleting building:', error);
        alert('Có lỗi xảy ra khi xóa tòa nhà');
    }
}
//hàm xóa phòng
async function deleteRoom() {
    if (!confirm('Bạn có chắc muốn xóa phòng này?')) {
        return;
    }
    
    try {
        const response = await fetch('api.php?action=deleteRoom', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomId: selectedRoomId })
        });
        
        const result = await response.json();
        if (result.success) {
            await fetchData();
            closeEditStatus();
        } else {
            alert(result.error || 'Không thể xóa phòng');
        }
    } catch (error) {
        console.error('Error deleting room:', error);
        alert('Có lỗi xảy ra khi xóa phòng');
    }
}
//hàm mở modal thanh toán
function openPaymentSearch() {
    document.getElementById('paymentSearchModal').style.display = 'block';
    document.getElementById('paymentInfo').style.display = 'none';
    document.getElementById('paymentStudentId').value = '';
}
//hàm đóng modal thanh toán
function closePaymentSearch() {
    document.getElementById('paymentSearchModal').style.display = 'none';
}
//hàm tìm kiếm sinh viên thanh toán
async function searchStudentPayment() {
    const studentId = document.getElementById('paymentStudentId').value;
    if (!studentId) {
        alert('Vui lòng nhập MSSV');
        return;
    }

    try {
        const response = await fetch(`api.php?action=searchStudent&studentId=${studentId}`);
        const data = await response.json();
        
        if (!data) {
            alert('Không tìm thấy sinh viên');
            return;
        }

        const paymentInfo = document.getElementById('paymentInfo');
        const currentSemester = getCurrentSemester();
        const isPaid = data.payment_status === 'completed' && 
                      data.payment_semester === currentSemester;

        paymentInfo.innerHTML = `
            <div class="student-payment-info">
                <h3>Thông Tin Sinh Viên</h3>
                <p><strong>Họ và tên:</strong> ${data.student_name}</p>
                <p><strong>MSSV:</strong> ${data.student_id}</p>
                <p><strong>Phòng:</strong> ${data.room_number} - Tòa ${data.building_name}</p>
                <p><strong>Giá phòng:</strong> ${formatPrice(data.room_price)}đ/học kỳ</p>
                <p><strong>Trạng thái:</strong> 
                    <span class="payment-status ${isPaid ? 'paid' : 'unpaid'}">
                        ${isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                    </span>
                </p>
                ${!isPaid ? `
                    <button onclick="makePayment(${data.id}, ${data.room_price})">
                        Thanh toán học kỳ ${currentSemester}
                    </button>
                ` : ''}
            </div>
        `;
        paymentInfo.style.display = 'block';
    } catch (error) {
        console.error('Error searching student:', error);
        alert('Có lỗi xảy ra khi tìm kiếm');
    }
}
//hàm lấy học kỳ hiện tại
function getCurrentSemester() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    return month >= 8 ? `${year}-1` : `${year}-2`;
}
//hàm thanh toán tiền phòng
async function makePayment(registrationId, amount) {
    if (!confirm('Xác nhận thanh toán tiền phòng?')) return;

    try {
        const response = await fetch('api.php?action=makePayment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                registrationId: registrationId,
                amount: amount,
                semester: getCurrentSemester()
            })
        });

        const result = await response.json();
        if (result.success) {
            alert('Thanh toán thành công!');
            searchStudentPayment(); // Refresh payment info
        } else {
            alert('Có lỗi xảy ra: ' + result.error);
        }
    } catch (error) {
        console.error('Error making payment:', error);
        alert('Có lỗi xảy ra khi thanh toán');
    }
}

// Thêm hàm hiển thị sinh viên chưa đóng tiền
async function showUnpaidStudents() {
    try {
        const currentSemester = getCurrentSemester();
        const response = await fetch(`api.php?action=getUnpaidStudents&semester=${currentSemester}`);
        const students = await response.json();
        
        const container = document.getElementById('unpaidStudentsList');
        
        if (students.length === 0) {
            container.innerHTML = '<div class="no-results">Không có sinh viên nào chưa đóng tiền</div>';
        } else {
            // Nhóm sinh viên theo tòa nhà
            const groupedStudents = {};
            students.forEach(student => {
                if (!groupedStudents[student.building_name]) {
                    groupedStudents[student.building_name] = [];
                }
                groupedStudents[student.building_name].push(student);
            });
            
            // Hiển thị danh sách theo nhóm
            container.innerHTML = Object.entries(groupedStudents).map(([building, students]) => `
                <div class="building-group">
                    <h3>Tòa ${building}</h3>
                    ${students.map(student => `
                        <div class="unpaid-student-item">
                            <div class="student-info">
                                <p><strong>Họ và tên:</strong> ${student.student_name}</p>
                                <p><strong>MSSV:</strong> ${student.student_id}</p>
                                <p><strong>Phòng:</strong> ${student.room_number}</p>
                                <p><strong>Số tiền:</strong> ${formatPrice(student.room_price)}đ</p>
                            </div>
                            <button onclick="makePayment(${student.id}, ${student.room_price})">
                                Thanh toán
                            </button>
                        </div>
                    `).join('')}
                </div>
            `).join('');
        }
        
        document.getElementById('unpaidStudentsModal').style.display = 'block';
    } catch (error) {
        console.error('Error fetching unpaid students:', error);
        alert('Có lỗi xảy ra khi lấy danh sách sinh viên chưa đóng tiền');
    }
}

// Thêm hàm đóng modal danh sách sinh viên chưa đóng tiền
function closeUnpaidStudents() {
    document.getElementById('unpaidStudentsModal').style.display = 'none';
}
// Thêm hàm để xử lý dropdown
function toggleDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    const button = dropdown.previousElementSibling;
    
    // Toggle dropdown hiện tại
    dropdown.classList.toggle('show');
    button.classList.toggle('active');
}

