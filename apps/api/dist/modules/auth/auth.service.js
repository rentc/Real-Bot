"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcryptjs");
const firebase_service_1 = require("../../shared/firebase/firebase.service");
let AuthService = AuthService_1 = class AuthService {
    constructor(firebase, jwt) {
        this.firebase = firebase;
        this.jwt = jwt;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    async login(email, password) {
        const usersSnapshot = await this.firebase.db.collection('users').where('email', '==', email).limit(1).get();
        if (usersSnapshot.empty) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const userDoc = usersSnapshot.docs[0];
        const user = userDoc.data();
        const userId = userDoc.id;
        if (!user.isActive) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        let tenantName = 'Unknown Tenant';
        if (user.tenantId) {
            const tenantDoc = await this.firebase.db.collection('tenants').doc(user.tenantId).get();
            if (tenantDoc.exists) {
                tenantName = tenantDoc.data()?.name || tenantName;
            }
        }
        const payload = {
            sub: userId,
            email: user.email,
            tenantId: user.tenantId,
            isSuperAdmin: user.isSuperAdmin,
        };
        return {
            accessToken: this.jwt.sign(payload),
            user: {
                id: userId,
                email: user.email,
                displayName: user.displayName,
                tenantId: user.tenantId,
                tenantName: tenantName,
                isSuperAdmin: user.isSuperAdmin,
            },
        };
    }
    async validateUser(payload) {
        const userDoc = await this.firebase.db.collection('users').doc(payload.sub).get();
        if (!userDoc.exists) {
            throw new common_1.UnauthorizedException('User not found or inactive');
        }
        const user = userDoc.data();
        if (!user?.isActive) {
            throw new common_1.UnauthorizedException('User not found or inactive');
        }
        return {
            id: userDoc.id,
            email: user.email,
            tenantId: user.tenantId,
            isSuperAdmin: user.isSuperAdmin,
        };
    }
    async hashPassword(password) {
        return bcrypt.hash(password, 12);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [firebase_service_1.FirebaseService,
        jwt_1.JwtService])
], AuthService);
