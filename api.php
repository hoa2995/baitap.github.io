<?php
//Thiết lập header Json và kết nối database
header('Content-Type: application/json');
require_once 'config.php';

// Lấy danh sách tòa nhà
function getBuildings() {
    global $pdo;
    $stmt = $pdo->query("SELECT * FROM buildings ORDER BY name");
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// Lấy danh sách phòng
function getRooms() {
    global $pdo;
    $stmt = $pdo->query("SELECT r.*, b.name as building FROM rooms r JOIN buildings b ON r.building_id = b.id");
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// Xử lý các request
$action = $_GET['action'] ?? '';

switch($action) {
    case 'getBuildings':
        echo json_encode(getBuildings());
        break;
    //hàm lấy danh sách phòng
    case 'getRooms':
        $sql = "SELECT r.*, b.name as building_name 
                FROM rooms r 
                JOIN buildings b ON r.building_id = b.id";
        $stmt = $pdo->query($sql);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        break;
    //hàm thêm phòng mới
    case 'addRoom':
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("INSERT INTO rooms (number, building_id, max_occupants, price, status) VALUES (?, ?, ?, ?, 'available')");
        $stmt->execute([$data['number'], $data['building_id'], $data['max_occupants'], $data['price']]);
        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
        break;
    //hàm đăng ký phòng cho sinh viên
    case 'addRegistration':
        $data = json_decode(file_get_contents('php://input'), true);
        try {
            $pdo->beginTransaction();
            
            // Kiểm tra số lượng người hiện tại trong phòng
            $stmt = $pdo->prepare("SELECT current_occupants, max_occupants FROM rooms WHERE id = ?");
            $stmt->execute([$data['roomId']]);
            $room = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Nếu phòng đã đủ người, không cho đăng ký
            if ($room['current_occupants'] >= $room['max_occupants']) {
                throw new Exception('Phòng đã đủ người');
            }
            
            // Thêm đăng ký mới
            $stmt = $pdo->prepare("INSERT INTO registrations (room_id, student_name, student_id, student_phone, student_email, student_faculty) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $data['roomId'],
                $data['studentName'],
                $data['studentId'],
                $data['studentPhone'],
                $data['studentEmail'],
                $data['studentFaculty']
            ]);
            
            // Cập nhật số người và trạng thái phòng
            $newOccupants = $room['current_occupants'] + 1;
            $newStatus = $newOccupants >= $room['max_occupants'] ? 'occupied' : 'available';
            
            $stmt = $pdo->prepare("UPDATE rooms SET current_occupants = ?, status = ? WHERE id = ?");
            $stmt->execute([$newOccupants, $newStatus, $data['roomId']]);
            
            $pdo->commit();
            echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
        } catch (Exception $e) {
            $pdo->rollBack();
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        break;
    //hàm lấy danh sách sinh viên
    case 'getAllStudents':
        $stmt = $pdo->query("
            SELECT * FROM registrations 
            ORDER BY student_name
        ");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        break;
    //hàm lấy danh sách đăng ký
    case 'getRegistrations':
        $sql = "SELECT r.*, rm.number as room_number, b.name as building_name 
                FROM registrations r 
                JOIN rooms rm ON r.room_id = rm.id 
                JOIN buildings b ON rm.building_id = b.id 
                ORDER BY r.registration_date DESC";
        $stmt = $pdo->query($sql);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        break;
        
    case 'updateRoomStatus':
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("UPDATE rooms SET status = ? WHERE id = ?");
        $success = $stmt->execute([$data['status'], $data['roomId']]);
        echo json_encode(['success' => $success]);
        break;
        
    case 'cancelRegistration':
        $data = json_decode(file_get_contents('php://input'), true);
        try {
            $pdo->beginTransaction();
            
            // Lấy room_id và thông tin phòng
            $stmt = $pdo->prepare("
                SELECT r.room_id, rm.current_occupants, rm.max_occupants 
                FROM registrations r
                JOIN rooms rm ON r.room_id = rm.id 
                WHERE r.id = ?
            ");
            $stmt->execute([$data['registrationId']]);
            $info = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Giảm số người và cập nhật trạng thái phòng
            $newOccupants = $info['current_occupants'] - 1;
            $newStatus = $newOccupants >= $info['max_occupants'] ? 'occupied' : 'available';
            
            $stmt = $pdo->prepare("UPDATE rooms SET current_occupants = ?, status = ? WHERE id = ?");
            $stmt->execute([$newOccupants, $newStatus, $info['room_id']]);
            
            // Xóa đăng ký
            $stmt = $pdo->prepare("DELETE FROM registrations WHERE id = ?");
            $stmt->execute([$data['registrationId']]);
            
            $pdo->commit();
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            $pdo->rollBack();
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        break;
    //hàm lấy danh sách sinh viên trong phòng
    case 'getStudents':
        $roomId = $_GET['roomId'];
        $sql = "SELECT r.*, DATE_FORMAT(r.registration_date, '%d/%m/%Y') as formatted_date 
                FROM registrations r 
                WHERE r.room_id = ? 
                ORDER BY r.registration_date DESC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$roomId]);
        $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode($students);
        break;
    //hàm thêm tòa nhà mới
    case 'addBuilding':
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("INSERT INTO buildings (name) VALUES (?)");
        $stmt->execute([$data['name']]);
        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
        break;
    //hàm cập nhật tòa nhà
    case 'updateBuilding':
        $data = json_decode(file_get_contents('php://input'), true);
        try {
            $stmt = $pdo->prepare("UPDATE buildings SET name = ? WHERE id = ?");
            $stmt->execute([$data['name'], $data['id']]);
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        break;
    //hàm xóa tòa nhà
    case 'deleteBuilding':
        $data = json_decode(file_get_contents('php://input'), true);
        try {
            $pdo->beginTransaction();
            
            // Kiểm tra xem có phòng nào đang có người ở không
            $stmt = $pdo->prepare("
                SELECT COUNT(*) as occupied_rooms 
                FROM rooms 
                WHERE building_id = ? AND current_occupants > 0
            ");
            $stmt->execute([$data['id']]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($result['occupied_rooms'] > 0) {
                throw new Exception('Không thể xóa tòa nhà vì có phòng đang có người ở');
            }
            
            // Xóa tất cả đăng ký trong các phòng của tòa nhà
            $stmt = $pdo->prepare("
                DELETE r FROM registrations r
                INNER JOIN rooms rm ON r.room_id = rm.id
                WHERE rm.building_id = ?
            ");
            $stmt->execute([$data['id']]);
            
            // Xóa tất cả phòng trong tòa nhà
            $stmt = $pdo->prepare("DELETE FROM rooms WHERE building_id = ?");
            $stmt->execute([$data['id']]);
            
            // Xóa tòa nhà
            $stmt = $pdo->prepare("DELETE FROM buildings WHERE id = ?");
            $stmt->execute([$data['id']]);
            
            $pdo->commit();
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            $pdo->rollBack();
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        break;
    //hàm xóa phòng
    case 'deleteRoom':
        $data = json_decode(file_get_contents('php://input'), true);
        try {
            $pdo->beginTransaction();
            
            // Kiểm tra xem phòng có sinh viên không
            $stmt = $pdo->prepare("
                SELECT COUNT(*) as student_count 
                FROM registrations 
                WHERE room_id = ?
            ");
            $stmt->execute([$data['roomId']]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($result['student_count'] > 0) {
                throw new Exception('Không thể xóa phòng vì đang có sinh viên ở');
            }
            
            // Xóa phòng
            $stmt = $pdo->prepare("DELETE FROM rooms WHERE id = ?");
            $stmt->execute([$data['roomId']]);
            
            $pdo->commit();
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            $pdo->rollBack();
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        break;
    //hàm tìm kiếm sinh viên
    case 'searchStudent':
        $studentId = $_GET['studentId'];
        $sql = "SELECT r.*, rm.number as room_number, rm.price as room_price,
                b.name as building_name, p.status as payment_status,
                p.semester as payment_semester, p.payment_date
                FROM registrations r 
                JOIN rooms rm ON r.room_id = rm.id 
                JOIN buildings b ON rm.building_id = b.id
                LEFT JOIN payments p ON r.id = p.registration_id
                WHERE r.student_id = ?";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$studentId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        echo json_encode($result);
        break;
    //hàm thanh toán tiền phòng
    case 'makePayment':
        $data = json_decode(file_get_contents('php://input'), true);
        try {
            $pdo->beginTransaction();
            
            $stmt = $pdo->prepare("INSERT INTO payments (registration_id, amount, semester, status) 
                                  VALUES (?, ?, ?, 'completed')");
            $stmt->execute([
                $data['registrationId'],
                $data['amount'],
                $data['semester']
            ]);
            
            $pdo->commit();
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            $pdo->rollBack();
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        break;
    //hàm lấy danh sách sinh viên chưa thanh toán
    case 'getUnpaidStudents':
        $currentSemester = $_GET['semester'];
        $sql = "SELECT r.*, rm.number as room_number, rm.price as room_price,
                b.name as building_name
                FROM registrations r 
                JOIN rooms rm ON r.room_id = rm.id 
                JOIN buildings b ON rm.building_id = b.id
                LEFT JOIN payments p ON r.id = p.registration_id 
                    AND p.semester = ?
                WHERE p.id IS NULL
                ORDER BY b.name, rm.number";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$currentSemester]);
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($result);
        break;
        
    // Thêm các case khác theo nhu cầus
}
?>
