# 🏥 Sistema de Gestión para Clínica Veterinaria

## 📋 Descripción del Proyecto

Este proyecto representa el **trabajo final del curso** de Ingeniería en Tecnologías de la Información, específicamente diseñado para demostrar competencias en desarrollo web, bases de datos, arquitectura de software y gestión de proyectos.

### 🎯 Objetivo Académico
Desarrollar un sistema distribuido basado en microservicios para la gestión integral de una clínica veterinaria, implementando las mejores prácticas de ingeniería de software y demostrando dominio en múltiples tecnologías.

---

## 🏗️ Arquitectura del Sistema

### **Modelo Distribuido con Microservicios**
El sistema implementa una arquitectura moderna que separa las responsabilidades en servicios independientes:

- **Frontend**: Interfaz web responsiva en PHP
- **Backend**: Lógica de negocio modular
- **Base de Datos**: MySQL con relaciones normalizadas
- **API REST**: Microservicio para operaciones CRUD
- **Autenticación**: Sistema de roles y permisos

### **Patrón MVC Simplificado**
```
Modelo      → Base de datos y lógica de negocio
Vista       → Interfaz de usuario (HTML/CSS)
Controlador → Páginas PHP que manejan la lógica
```

---

## 🗄️ Diseño de Base de Datos

### **Modelo Entidad-Relación (ER)**
El sistema implementa un modelo ER completo con **8 entidades principales**:

#### **1. Tabla `usuarios`**
```sql
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol ENUM('administrador', 'desarrollador', 'supervisor') NOT NULL
);
```
**Propósito**: Control de acceso y autenticación del sistema

#### **2. Tabla `clientes`**
```sql
CREATE TABLE clientes (
    codigo_cliente INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    direccion VARCHAR(200),
    telefono VARCHAR(15),
    email VARCHAR(100)
);
```
**Propósito**: Gestión de propietarios de mascotas

#### **3. Tabla `veterinarios`**
```sql
CREATE TABLE veterinarios (
    codigo_veterinario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    especialidad VARCHAR(50),
    telefono VARCHAR(15),
    email VARCHAR(100)
);
```
**Propósito**: Información del personal médico

#### **4. Tabla `mascotas`**
```sql
CREATE TABLE mascotas (
    codigo_mascota INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    especie VARCHAR(30) NOT NULL,
    raza VARCHAR(50),
    edad INT,
    codigo_cliente INT,
    FOREIGN KEY (codigo_cliente) REFERENCES clientes(codigo_cliente)
);
```
**Propósito**: Registro de animales atendidos

#### **5. Tabla `consultas`**
```sql
CREATE TABLE consultas (
    codigo_consulta INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATE NOT NULL,
    motivo TEXT,
    diagnostico TEXT,
    codigo_mascota INT,
    codigo_veterinario INT,
    FOREIGN KEY (codigo_mascota) REFERENCES mascotas(codigo_mascota),
    FOREIGN KEY (codigo_veterinario) REFERENCES veterinarios(codigo_veterinario)
);
```
**Propósito**: Historial médico de visitas

#### **6. Tabla `tratamientos`**
```sql
CREATE TABLE tratamientos (
    codigo_tratamiento INT AUTO_INCREMENT PRIMARY KEY,
    codigo_consulta INT,
    descripcion TEXT,
    duracion_dias INT,
    FOREIGN KEY (codigo_consulta) REFERENCES consultas(codigo_consulta)
);
```
**Propósito**: Procedimientos médicos aplicados

#### **7. Tabla `medicamentos`**
```sql
CREATE TABLE medicamentos (
    codigo_medicamento INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    stock INT DEFAULT 0,
    precio DECIMAL(10,2)
);
```
**Propósito**: Inventario farmacéutico

#### **8. Tabla `tratamiento_medicamento`**
```sql
CREATE TABLE tratamiento_medicamento (
    codigo_registro INT AUTO_INCREMENT PRIMARY KEY,
    codigo_tratamiento INT,
    codigo_medicamento INT,
    dosis VARCHAR(50),
    frecuencia VARCHAR(50),
    FOREIGN KEY (codigo_tratamiento) REFERENCES tratamientos(codigo_tratamiento),
    FOREIGN KEY (codigo_medicamento) REFERENCES medicamentos(codigo_medicamento)
);
```
**Propósito**: Relación muchos a muchos entre tratamientos y medicamentos

### **Relaciones Clave del Modelo ER**
```
Cliente (1) ←→ (N) Mascotas
Mascota (1) ←→ (N) Consultas
Consulta (1) ←→ (N) Tratamientos
Tratamiento (N) ←→ (N) Medicamentos
```

---

## 🔐 Sistema de Autenticación y Control de Acceso

### **Arquitectura de Seguridad**
El sistema implementa un modelo de seguridad basado en roles (RBAC - Role-Based Access Control) con tres niveles de acceso:

#### **1. Administrador** 🔴
- **Permisos**: Acceso completo a todas las funcionalidades
- **Operaciones**: CRUD en todas las tablas
- **Módulos**: Gestión de usuarios, medicamentos, configuración del sistema
- **Casos de uso**: Director de la clínica, administrador del sistema

#### **2. Desarrollador** 🟡
- **Permisos**: Acceso limitado a consultas y tratamientos
- **Operaciones**: Crear, leer, actualizar en módulos específicos
- **Módulos**: Consultas, tratamientos, mascotas
- **Casos de uso**: Veterinarios, personal médico

#### **3. Supervisor** 🟢
- **Permisos**: Solo lectura en la mayoría de módulos
- **Operaciones**: SELECT y vistas
- **Módulos**: Consulta de información sin modificación
- **Casos de uso**: Recepcionistas, personal administrativo

### **Implementación Técnica**
```php
function checkRole($required_role) {
    if (isAdmin()) return; // Administradores tienen acceso total
    $roles = is_array($required_role) ? $required_role : [$required_role];
    if (!isset($_SESSION['rol']) || !in_array($_SESSION['rol'], $roles, true)) {
        http_response_code(403);
        die("No tienes permisos para acceder a esta página");
    }
}
```

---

## 🔌 Microservicio REST API

### **Arquitectura del Microservicio**
El sistema incluye un microservicio REST para la gestión de mascotas, demostrando competencias en:
- **APIs RESTful**
- **Comunicación entre servicios**
- **Manejo de datos JSON**
- **Operaciones CRUD**

### **Endpoints Disponibles**
```
GET    /api/mascotas_api.php          # Obtener todas las mascotas
GET    /api/mascotas_api.php?id=X     # Obtener mascota específica
POST   /api/mascotas_api.php          # Crear nueva mascota
PUT    /api/mascotas_api.php?id=X     # Actualizar mascota
DELETE /api/mascotas_api.php?id=X     # Eliminar mascota
```

### **Ejemplo de Respuesta JSON**
```json
{
    "success": true,
    "data": [
        {
            "codigo_mascota": 1,
            "nombre": "Bobby",
            "especie": "Perro",
            "raza": "Golden Retriever",
            "edad": 3,
            "cliente_nombre": "Juan Pérez"
        }
    ]
}
```

---

## 💻 Funcionalidades del Sistema

### **Módulos Implementados**

#### **1. Gestión de Usuarios** 👥
- Crear, editar y eliminar usuarios del sistema
- Asignación de roles y permisos
- Control de acceso granular
- **Solo para administradores**

#### **2. Gestión de Clientes** 👤
- Registro de propietarios de mascotas
- Información de contacto completa
- Historial de mascotas asociadas
- **Acceso: Administrador (CRUD), Otros (Lectura)**

#### **3. Gestión de Veterinarios** 👨‍⚕️
- Registro del personal médico
- Especialidades y contacto
- Asignación a consultas
- **Acceso: Administrador (CRUD), Otros (Lectura)**

#### **4. Gestión de Mascotas** 🐕
- Registro de animales atendidos
- Información de especie, raza y edad
- Asociación con propietarios
- **Acceso: Todos los roles**

#### **5. Gestión de Consultas** 📋
- Registro de visitas médicas
- Motivo, diagnóstico y observaciones
- Asociación mascota-veterinario
- **Acceso: Administrador y Desarrollador**

#### **6. Gestión de Tratamientos** 💊
- Procedimientos médicos aplicados
- Duración y descripción
- Asociación con consultas
- **Acceso: Administrador y Desarrollador**

#### **7. Gestión de Medicamentos** 💊
- Inventario farmacéutico
- Stock y precios
- Control de existencias
- **Solo para administradores**

#### **8. Tratamiento-Medicamento** 🔗
- Relación muchos a muchos
- Dosis y frecuencia
- Asociación tratamientos-medicamentos
- **Solo para administradores**

---

## 🛡️ Medidas de Seguridad Implementadas

### **1. Prevención de SQL Injection**
```php
// Uso de Prepared Statements
$stmt = $db->prepare("SELECT * FROM usuarios WHERE usuario = ? AND password = ?");
$stmt->execute([$usuario, $password]);
```

### **2. Prevención de XSS (Cross-Site Scripting)**
```php
// Sanitización de datos de salida
echo htmlspecialchars($user['nombre']);
```

### **3. Control de Sesiones**
```php
// Regeneración de ID de sesión
session_regenerate_id(true);
// Limpieza completa en logout
session_destroy();
```

### **4. Validación de Roles**
```php
// Verificación de permisos en cada página
checkRole('administrador');
```

---

## 🎨 Interfaz de Usuario

### **Características del Diseño**
- **Responsivo**: Adaptable a dispositivos móviles y desktop
- **Intuitivo**: Navegación clara y lógica
- **Consistente**: Diseño uniforme en todas las páginas
- **Accesible**: Controles fáciles de usar

### **Estructura de Navegación**
```html
<nav>
    <ul>
        <li><a href="mascotas.php">Gestión de Mascotas</a></li>
        <li><a href="clientes.php">Gestión de Clientes</a></li>
        <!-- Menú dinámico según rol del usuario -->
    </ul>
</nav>
```

### **Menú Dinámico por Roles**
- **Administrador**: Acceso a todos los módulos
- **Desarrollador**: Módulos de consultas y tratamientos
- **Supervisor**: Solo módulos de consulta

---

## 🔧 Aspectos Técnicos Destacados

### **1. Conexión a Base de Datos (Patrón Singleton)**
```php
class Database {
    private static $instance = null;
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new Database();
        }
        return self::$instance;
    }
    
    public function connect() {
        $this->conn = new PDO("mysql:host=" . $this->host . ";dbname=" . $this->database, 
                              $this->username, $this->password);
        $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $this->conn;
    }
}
```

### **2. Manejo de Errores**
```php
try {
    $stmt = $db->prepare($sql);
    $result = $stmt->execute($params);
    return $result;
} catch (PDOException $e) {
    error_log("Error de base de datos: " . $e->getMessage());
    return false;
}
```

### **3. Validación de Formularios**
```php
// Validación del lado del servidor
if (empty($_POST['nombre']) || empty($_POST['especie'])) {
    $error = "Los campos nombre y especie son obligatorios";
}
```

---

## 📊 Datos de Prueba y Usuarios

### **Usuarios del Sistema**
| Usuario | Contraseña | Rol | Descripción |
|---------|------------|-----|-------------|
| `admin` | `admin123` | Administrador | Acceso completo al sistema |
| `developer` | `dev123` | Desarrollador | Acceso a consultas y tratamientos |
| `supervisor` | `super123` | Supervisor | Solo lectura en la mayoría de módulos |

### **Datos de Ejemplo Incluidos**
- **2 clientes** con información completa
- **2 veterinarios** con especialidades
- **2 mascotas** asociadas a clientes
- **2 medicamentos** en inventario
- **2 consultas** con diagnósticos
- **2 tratamientos** asociados a consultas
- **1 relación** tratamiento-medicamento

---

## 🚀 Instalación y Configuración

### **Requisitos del Sistema**
- **PHP**: 7.4 o superior
- **MySQL**: 5.7 o MariaDB 10.2 o superior
- **Servidor Web**: Apache 2.4+ o Nginx
- **Extensiones PHP**: PDO, PDO_MySQL, session

### **Pasos de Instalación**

#### **1. Preparación del Entorno**
```bash
# Clonar o descargar el proyecto
cd /var/www/html/
# Colocar archivos en carpeta clinica_veterinaria
```

#### **2. Configuración de Base de Datos**
```bash
# Importar el script SQL
mysql -u root -p < database.sql
```

#### **3. Configuración de Conexión**
Editar `config/database.php`:
```php
private $host = "localhost";
private $username = "tu_usuario";
private $password = "tu_password";
private $database = "clinica_veterinaria";
```

#### **4. Configuración de Permisos**
```bash
chmod 755 /var/www/html/clinicaveterinaria
chmod 644 /var/www/html/clinicaveterinaria/config/database.php
```

#### **5. Acceso al Sistema**
```
URL: http://localhost/clinicaveterinaria/
Usuario: admin
Contraseña: admin123
```

---

## 📁 Estructura del Proyecto

```
clinica_veterinaria/
├── 📄 index.php                           # Página de login principal
├── 📄 database.sql                        # Script completo de base de datos
├── 📁 config/
│   └── 📄 database.php                    # Configuración de conexión BD
├── 📁 includes/
│   └── 📄 auth.php                        # Funciones de autenticación
├── 📁 pages/                              # Módulos del sistema
│   ├── 📄 dashboard.php                   # Panel principal
│   ├── 📄 usuarios.php                    # Gestión de usuarios
│   ├── 📄 clientes.php                    # Gestión de clientes
│   ├── 📄 veterinarios.php                # Gestión de veterinarios
│   ├── 📄 mascotas.php                    # Gestión de mascotas
│   ├── 📄 consultas.php                   # Gestión de consultas
│   ├── 📄 tratamientos.php                # Gestión de tratamientos
│   ├── 📄 medicamentos.php                # Gestión de medicamentos
│   └── 📄 tratamiento_medicamento.php     # Relación tratamientos-medicamentos
├── 📁 api/
│   └── 📄 mascotas_api.php                # Microservicio REST
└── 📁 assets/
    └── 📄 style.css                       # Estilos CSS
```

---

## 🎓 Competencias Demostradas

### **Competencias Técnicas**
✅ **Desarrollo Web**: PHP, HTML, CSS  
✅ **Bases de Datos**: MySQL, SQL, Modelo ER  
✅ **Arquitectura de Software**: Microservicios, MVC  
✅ **APIs**: REST, JSON, HTTP Methods  
✅ **Seguridad**: Autenticación, Autorización, Validación  
✅ **Gestión de Proyectos**: Estructura modular, Documentación  

### **Competencias Profesionales**
✅ **Análisis de Requisitos**: Interpretación de especificaciones  
✅ **Diseño de Sistemas**: Modelado de datos y procesos  
✅ **Implementación**: Código limpio y mantenible  
✅ **Testing**: Validación de funcionalidades  
✅ **Documentación**: README completo y comentarios  

---

## 🔍 Casos de Uso del Sistema

### **Escenario 1: Registro de Nueva Mascota**
1. **Cliente** llega con su mascota
2. **Recepcionista** (Supervisor) registra datos del cliente
3. **Veterinario** (Desarrollador) registra información de la mascota
4. **Sistema** asocia mascota con cliente automáticamente

### **Escenario 2: Consulta Médica**
1. **Veterinario** crea nueva consulta
2. **Sistema** registra fecha, motivo y diagnóstico
3. **Veterinario** asigna tratamiento si es necesario
4. **Sistema** actualiza historial médico

### **Escenario 3: Gestión de Inventario**
1. **Administrador** revisa stock de medicamentos
2. **Sistema** muestra alertas de stock bajo
3. **Administrador** actualiza inventario
4. **Sistema** registra cambios en auditoría

---

## 🚀 Funcionalidades Avanzadas

### **1. Control de Acceso Granular**
- Permisos específicos por módulo
- Validación de roles en tiempo real
- Redirección automática según permisos

### **2. Validación de Datos**
- Validación del lado del servidor
- Sanitización de entradas
- Prevención de inyección SQL

### **3. Manejo de Errores**
- Mensajes de error informativos
- Logging de errores críticos
- Recuperación graceful de fallos

### **4. Interfaz Responsiva**
- Diseño adaptable a móviles
- Navegación intuitiva
- Feedback visual de acciones

---

## 📈 Métricas del Proyecto

### **Estadísticas de Desarrollo**
- **Líneas de código**: ~2,500 líneas
- **Archivos PHP**: 12 archivos
- **Tablas de BD**: 8 entidades
- **Módulos funcionales**: 8 módulos
- **Tiempo de desarrollo**: 3 horas (según especificaciones)

### **Cobertura de Funcionalidades**
- ✅ **CRUD completo** en todas las entidades
- ✅ **Sistema de roles** implementado
- ✅ **Microservicio REST** funcional
- ✅ **Interfaz de usuario** completa
- ✅ **Base de datos** normalizada
- ✅ **Seguridad** implementada

---

## 🎯 Conclusiones y Aprendizajes

### **Logros Alcanzados**
Este proyecto demuestra la capacidad de:
- **Analizar** requerimientos complejos
- **Diseñar** arquitecturas escalables
- **Implementar** soluciones robustas
- **Documentar** procesos técnicos
- **Presentar** resultados profesionales

### **Aplicación en el Mundo Real**
El sistema desarrollado puede ser implementado en:
- **Clínicas veterinarias** pequeñas y medianas
- **Hospitales veterinarios** con múltiples especialidades
- **Consultorios** veterinarios independientes
- **Centros de investigación** animal

### **Valor Educativo**
Este proyecto integra conocimientos de:
- **Ingeniería de Software**
- **Bases de Datos**
- **Desarrollo Web**
- **Arquitectura de Sistemas**
- **Gestión de Proyectos**

---

## 📞 Contacto y Soporte

### **Información del Proyecto**
- **Curso**: Ingeniería en Tecnologías de la Información
- **Período**: Abril - Agosto 2025
- **Institución**: ESPE
- **Tipo**: Proyecto Final de Curso

### **Tecnologías Utilizadas**
- **Backend**: PHP 7.4+
- **Base de Datos**: MySQL 5.7+
- **Frontend**: HTML5, CSS3, JavaScript
- **Arquitectura**: Microservicios REST
- **Seguridad**: Autenticación basada en roles

---


�� Introducción
Buenos días, hoy presentaré el Sistema de Gestión para Clínica Veterinaria, una aplicación web desarrollada en PHP que implementa un modelo distribuido basado en microservicios para la administración integral de una clínica veterinaria.
📋 Objetivos del Sistema
Objetivo Principal
Diseñar y desarrollar un sistema que permita gestionar toda la información relacionada con una clínica veterinaria, incluyendo:
Gestión de mascotas y clientes
Control de veterinarios y consultas
Administración de tratamientos y medicamentos
Sistema de usuarios con roles específicos
Características Técnicas
Arquitectura: Modelo distribuido con microservicios
Base de Datos: MySQL con 8 tablas relacionadas
Lenguaje: PHP con PDO para conexiones seguras
Interfaz: HTML/CSS con diseño responsivo
🗄️ Modelo de Base de Datos
Estructura de Tablas (8 entidades principales)
Relaciones Clave
Cliente → Mascotas: Un cliente puede tener múltiples mascotas
Mascota → Consultas: Una mascota puede tener múltiples consultas
Consulta → Tratamiento: Una consulta puede generar múltiples tratamientos
Tratamiento ↔ Medicamento: Relación muchos a muchos
🔐 Sistema de Autenticación y Roles
Tres Niveles de Usuario
1. Administrador
Acceso: Completo a todas las funcionalidades
Permisos: CRUD en todas las tablas
Funciones: Gestión de usuarios, medicamentos, etc.
2. Desarrollador
Acceso: Limitado a consultas y tratamientos
Permisos: Crear, leer, actualizar en módulos específicos
Funciones: Prueba de algoritmos y desarrollo
3. Supervisor
Acceso: Solo lectura en la mayoría de módulos
Permisos: SELECT y vistas
Funciones: Monitoreo y supervisión
Implementación de Seguridad
🏗️ Arquitectura del Sistema
Estructura de Archivos
🔌 Microservicio Implementado
API REST para Mascotas
Características del Microservicio
Formato de respuesta: JSON
Métodos HTTP: GET, POST, PUT, DELETE
Validación: Manejo de errores y respuestas estructuradas
Seguridad: Headers CORS configurados
💻 Funcionalidades Principales
1. Gestión de Mascotas
2. Control de Acceso por Roles
3. Validación de Datos
Sanitización: htmlspecialchars() para prevenir XSS
Prepared Statements: Prevención de SQL Injection
Validación de roles: Control de acceso granular
🎨 Interfaz de Usuario
Características del Diseño
Responsivo: Adaptable a diferentes dispositivos
Intuitivo: Navegación clara y lógica
Consistente: Diseño uniforme en todas las páginas
Accesible: Controles fáciles de usar
Estructura de Navegación
🔧 Aspectos Técnicos Destacados
1. Conexión a Base de Datos
2. Manejo de Sesiones
3. Control de Errores
Try-catch: Manejo de excepciones en operaciones críticas
Validación: Verificación de datos antes de procesar
Feedback: Mensajes informativos al usuario
📊 Datos de Prueba Incluidos
Usuarios del Sistema
admin/admin123 - Administrador
developer/dev123 - Desarrollador
supervisor/super123 - Supervisor
Datos de Ejemplo
2 clientes con información completa
2 veterinarios con especialidades
2 mascotas asociadas a clientes
2 medicamentos en inventario
Consultas y tratamientos de ejemplo
🚀 Instalación y Uso
Requisitos del Sistema
PHP 7.4 o superior
MySQL 5.7 o MariaDB 10.2
Servidor web (Apache/Nginx)
Pasos de Instalación
Importar base de datos: Ejecutar database.sql
Configurar conexión: Editar config/database.php
Acceder al sistema: http://localhost/clinicaveterinaria/
Iniciar sesión: Usar credenciales de prueba
�� Conclusiones
Logros Alcanzados
✅ Sistema completo con 8 módulos funcionales
✅ Control de acceso granular por roles
✅ Microservicio REST implementado
✅ Interfaz intuitiva y responsiva
✅ Base de datos normalizada y optimizada
✅ Seguridad implementada en múltiples niveles
Beneficios del Sistema
Eficiencia: Automatización de procesos administrativos
Seguridad: Control de acceso y validación de datos
Escalabilidad: Arquitectura modular y extensible
Usabilidad: Interfaz clara y fácil de usar
















-
