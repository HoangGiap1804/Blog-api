# Báo Cáo Tổng Hợp Lỗ Hổng Bảo Mật JWT

## Tổng Quan

Hệ thống Blog API chứa nhiều lỗ hổng bảo mật nghiêm trọng liên quan đến JWT (JSON Web Token). Các lỗ hổng này cho phép kẻ tấn công bypass authentication, privilege escalation, và truy cập trái phép vào hệ thống.

---

## 1. Algorithm Confusion Attack

### Mức Độ: **CRITICAL** (CVSS 9.1)

### Mô Tả
Hàm `verifyAccessToken()` tin tưởng algorithm được chỉ định trong token header thay vì chỉ định cứng algorithm. Điều này cho phép kẻ tấn công:
- Sử dụng algorithm "none" để bypass hoàn toàn signature verification
- Chỉ định bất kỳ algorithm nào và server sẽ chấp nhận

### Vị Trí
- File: `src/lib/jwt.ts`
- Hàm: `verifyAccessToken()`

### Code Vulnerable
```typescript
if (algorithm === 'none') {
  return decoded.payload; // Bypass signature verification!
} else {
  return jwt.verify(token, secret, {
    algorithms: [algorithm as jwt.Algorithm], // Trust algorithm from token
  });
}
```

### Cách Khai Thác
Tạo token với algorithm "none":
```bash
# Header: {"alg":"none","typ":"JWT"}
# Payload: {"userId":"...","role":"admin"}
# Token: eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VySWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJyb2xlIjoiYWRtaW4ifQ.
```

### Khắc Phục
```typescript
// Luôn chỉ định algorithm cụ thể
return jwt.verify(token, config.JWT_ACCESS_SECRET, {
  algorithms: ['HS256'] // Chỉ chấp nhận HS256
});
```

---

## 2. Token Leakage in Logs

### Mức Độ: **HIGH** (CVSS 7.5)

### Mô Tả
Access token và refresh token được log vào log files, có thể bị lộ qua:
- Log file access
- Log aggregation systems
- Log monitoring tools
- Error tracking services

### Vị Trí
- File: `src/controllers/v1/auth/login.ts` (line 74)
- File: `src/middlewares/authenticate.ts` (line 61)
- File: `src/controllers/v1/auth/logout.ts` (line 29)

### Code Vulnerable
```typescript
logger.info('User login successfully', {
  accessToken, // VULNERABILITY: Logging sensitive token data
});

logger.info('Authenticating request', {
  token, // VULNERABILITY: Logging token
});
```

### Tác Động
- Token có thể bị đánh cắp từ log files
- Kẻ tấn công có thể sử dụng token để truy cập hệ thống
- Vi phạm quy định bảo vệ dữ liệu (GDPR, PCI-DSS)

### Khắc Phục
```typescript
// Không log token, chỉ log metadata
logger.info('User login successfully', {
  username: user.username,
  email: user.email,
  role: user.role,
  // Không log accessToken
});
```

---

## 3. Accept Token from Query String

### Mức Độ: **HIGH** (CVSS 7.2)

### Mô Tả
Middleware `authenticate` chấp nhận token từ query string, làm tăng attack surface và cho phép token bị lộ qua:
- Server access logs
- Browser history
- Referrer headers
- Proxy logs
- Web analytics

### Vị Trí
- File: `src/middlewares/authenticate.ts` (line 42-44)

### Code Vulnerable
```typescript
// VULNERABILITY: Accept token from query string
if (!token && req.query.token) {
  token = req.query.token as string;
}
```

### Cách Khai Thác
```bash
# Token trong URL
curl "http://api.example.com/users/current?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Khắc Phục
```typescript
// Chỉ chấp nhận token từ Authorization header
const authHeader = req.headers.authorization;
if (!authHeader?.startsWith('Bearer ')) {
  return res.status(401).json({ error: 'No token provided' });
}
const token = authHeader.split(' ')[1];
```

---

## 4. Weak Secret Key Fallback

### Mức Độ: **CRITICAL** (CVSS 9.8)

### Mô Tả
Nếu `JWT_ACCESS_SECRET` không được set, hệ thống sử dụng secret key yếu mặc định `'secret123'`. Điều này cho phép kẻ tấn công dễ dàng brute-force hoặc đoán secret key.

### Vị Trí
- File: `src/lib/jwt.ts` (line 48)

### Code Vulnerable
```typescript
const secret = config.JWT_ACCESS_SECRET || 'secret123'; // VULNERABILITY: Weak default secret
```

### Tác Động
- Kẻ tấn công có thể tạo token giả mạo
- Bypass hoàn toàn authentication
- Full system compromise

### Khắc Phục
```typescript
if (!config.JWT_ACCESS_SECRET) {
  throw new Error('JWT_ACCESS_SECRET must be set');
}
const secret = config.JWT_ACCESS_SECRET;
```

---

## 5. Ignore Token Expiration

### Mức Độ: **HIGH** (CVSS 7.1)

### Mô Tả
Hệ thống có thể bỏ qua kiểm tra token expiration thông qua environment variable `IGNORE_TOKEN_EXPIRATION`. Điều này cho phép token đã hết hạn vẫn được chấp nhận.

### Vị Trí
- File: `src/lib/jwt.ts` (line 52, 56)

### Code Vulnerable
```typescript
const ignoreExpiration = process.env.IGNORE_TOKEN_EXPIRATION === 'true';
const verifyOptions: jwt.VerifyOptions = {
  ignoreExpiration, // VULNERABILITY: Can bypass expiration check
};
```

### Cách Khai Thác
```bash
# Set environment variable
export IGNORE_TOKEN_EXPIRATION=true

# Hoặc trong .env file
IGNORE_TOKEN_EXPIRATION=true
```

### Khắc Phục
```typescript
// Luôn kiểm tra expiration
const verifyOptions: jwt.VerifyOptions = {
  ignoreExpiration: false, // Luôn kiểm tra expiration
};
```

---

## 6. Access Token Not Revoked on Logout

### Mức Độ: **MEDIUM** (CVSS 6.5)

### Mô Tả
Khi user logout, chỉ refresh token bị xóa, nhưng access token vẫn còn hiệu lực cho đến khi hết hạn. Điều này cho phép:
- Token reuse attacks nếu token bị đánh cắp
- Session hijacking
- Unauthorized access sau khi logout

### Vị Trí
- File: `src/controllers/v1/auth/logout.ts` (line 38-41)

### Code Vulnerable
```typescript
// VULNERABILITY: Access token is not revoked on logout
// Access tokens remain valid even after logout until they expire
// Should implement token blacklist or shorter expiration times
```

### Khắc Phục
```typescript
// Implement token blacklist
import TokenBlacklist from '@/models/tokenBlacklist';

const accessToken = req.headers.authorization?.split(' ')[1];
if (accessToken) {
  await TokenBlacklist.create({
    token: accessToken,
    expiresAt: new Date(jwt.decode(accessToken).exp * 1000),
  });
}
```

---

## 7. Refresh Token Deletion Bug

### Mức Độ: **HIGH** (CVSS 7.0)

### Mô Tả
Hàm logout có bug khi xóa refresh token - sử dụng sai field (`req.userId` thay vì `refreshToken`). Điều này khiến refresh token không bao giờ bị xóa, cho phép token reuse.

### Vị Trí
- File: `src/controllers/v1/auth/logout.ts` (line 25)

### Code Vulnerable
```typescript
// BUG: Wrong field used
await Token.deleteOne({ token: req.userId }); // Should be { token: refreshToken }
```

### Khắc Phục
```typescript
await Token.deleteOne({ token: refreshToken });
```

---

## 8. Accept Token from Cookie

### Mức Độ: **MEDIUM** (CVSS 5.3)

### Mô Tả
Middleware chấp nhận access token từ cookie, điều này không an toàn vì:
- Access token nên chỉ được lưu trong memory (JavaScript)
- Cookie dễ bị XSS attacks
- Nên chỉ dùng cookie cho refresh token (với httpOnly flag)

### Vị Trí
- File: `src/middlewares/authenticate.ts` (line 47-49)

### Code Vulnerable
```typescript
// VULNERABILITY: Accept token from cookie
if (!token && req.cookies.accessToken) {
  token = req.cookies.accessToken as string;
}
```

### Khắc Phục
```typescript
// Chỉ chấp nhận token từ Authorization header
// Không chấp nhận từ cookie
```

---

## Tổng Kết

### Thống Kê
- **Tổng số lỗ hổng**: 8
- **Critical**: 2
- **High**: 4
- **Medium**: 2

### Khuyến Nghị Ưu Tiên

1. **Ngay lập tức**:
   - Sửa Algorithm Confusion Attack
   - Loại bỏ weak secret key fallback
   - Ngừng log token

2. **Sớm nhất có thể**:
   - Chỉ chấp nhận token từ Authorization header
   - Sửa bug refresh token deletion
   - Implement token blacklist

3. **Cải thiện bảo mật**:
   - Implement proper token rotation
   - Thêm rate limiting cho token generation
   - Implement token revocation mechanism

### Best Practices

1. **Luôn chỉ định algorithm cụ thể** trong jwt.verify()
2. **Không bao giờ log token** hoặc sensitive data
3. **Chỉ chấp nhận token từ Authorization header** (Bearer token)
4. **Sử dụng secret key mạnh** và không có fallback
5. **Luôn kiểm tra token expiration**
6. **Implement token blacklist** cho logout
7. **Sử dụng short expiration time** cho access token
8. **Implement proper error handling** không leak thông tin

---

## Tài Liệu Tham Khảo

- [OWASP JWT Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [CWE-327: Use of a Broken or Risky Cryptographic Algorithm](https://cwe.mitre.org/data/definitions/327.html)
- [CWE-532: Insertion of Sensitive Information into Log File](https://cwe.mitre.org/data/definitions/532.html)
- [JWT Best Practices (RFC 8725)](https://tools.ietf.org/html/rfc8725)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

## Lịch Sử

- **Ngày phát hiện**: [Ngày hiện tại]
- **Ngày báo cáo**: [Ngày hiện tại]
- **Trạng thái**: VULNERABLE (Đang được sử dụng cho mục đích giáo dục/báo cáo)

