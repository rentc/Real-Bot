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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentNumberingService = void 0;
const common_1 = require("@nestjs/common");
const firebase_service_1 = require("../../shared/firebase/firebase.service");
let DocumentNumberingService = class DocumentNumberingService {
    constructor(firebase) {
        this.firebase = firebase;
    }
    async generateDocumentNumber(tenantId, prefix = 'QT') {
        const db = this.firebase.db;
        const counterRef = db.collection('document_counters').doc(`${tenantId}_${prefix}`);
        const newNumber = await db.runTransaction(async (t) => {
            const doc = await t.get(counterRef);
            let currentSeq = 0;
            if (doc.exists) {
                currentSeq = doc.data()?.sequence || 0;
            }
            const nextSeq = currentSeq + 1;
            t.set(counterRef, { sequence: nextSeq }, { merge: true });
            return nextSeq;
        });
        const date = new Date();
        const yearMonth = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        const sequenceStr = newNumber.toString().padStart(3, '0');
        return `${prefix}-${yearMonth}-${sequenceStr}`;
    }
};
exports.DocumentNumberingService = DocumentNumberingService;
exports.DocumentNumberingService = DocumentNumberingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [firebase_service_1.FirebaseService])
], DocumentNumberingService);
