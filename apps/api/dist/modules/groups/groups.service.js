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
exports.GroupsService = void 0;
const common_1 = require("@nestjs/common");
const firebase_service_1 = require("../../shared/firebase/firebase.service");
let GroupsService = class GroupsService {
    constructor(firebase) {
        this.firebase = firebase;
    }
    async findAll() {
        const snapshot = await this.firebase.db.collection('lineGroups').orderBy('updatedAt', 'desc').get();
        const groups = [];
        for (const doc of snapshot.docs) {
            const data = doc.data();
            const membershipsSnapshot = await doc.ref.collection('memberships').get();
            groups.push({
                id: doc.id,
                ...data,
                _count: {
                    memberships: membershipsSnapshot.size,
                }
            });
        }
        return groups;
    }
    async findOne(id) {
        const groupDoc = await this.firebase.db.collection('lineGroups').doc(id).get();
        if (!groupDoc.exists) {
            throw new common_1.NotFoundException(`Group with ID ${id} not found`);
        }
        const membershipsSnapshot = await groupDoc.ref.collection('memberships').get();
        const memberships = await Promise.all(membershipsSnapshot.docs.map(async (doc) => {
            const data = doc.data();
            let userProfile = {};
            try {
                const userDoc = await this.firebase.db.collection('lineUsers').doc(doc.id).get();
                if (userDoc.exists) {
                    userProfile = userDoc.data() || {};
                }
            }
            catch (e) {
                console.error('Failed to fetch user profile', e);
            }
            let role = null;
            try {
                const rolesSnapshot = await doc.ref.collection('roles').where('isActive', '==', true).get();
                if (!rolesSnapshot.empty) {
                    role = rolesSnapshot.docs[0].data().roleId;
                }
            }
            catch (e) {
                console.error('Failed to fetch role', e);
            }
            return {
                id: doc.id,
                ...data,
                ...userProfile,
                role,
            };
        }));
        return {
            id: groupDoc.id,
            ...groupDoc.data(),
            memberships,
        };
    }
    async assignRole(groupId, userId, roleId, assignedByUserId) {
        const groupRef = this.firebase.db.collection('lineGroups').doc(groupId);
        const groupDoc = await groupRef.get();
        if (!groupDoc.exists) {
            throw new common_1.NotFoundException(`Group with ID ${groupId} not found`);
        }
        const membershipRef = groupRef.collection('memberships').doc(userId);
        const membershipDoc = await membershipRef.get();
        if (!membershipDoc.exists) {
            throw new common_1.NotFoundException(`Membership for user ${userId} in group ${groupId} not found`);
        }
        const existingRoles = await membershipRef.collection('roles').get();
        const batch = this.firebase.db.batch();
        existingRoles.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        const rolesRef = membershipRef.collection('roles').doc(roleId);
        await rolesRef.set({
            roleId: roleId,
            assignedBy: assignedByUserId,
            isActive: true,
            updatedAt: new Date(),
        }, { merge: true });
        return { success: true };
    }
    async removeRole(groupId, userId, roleId) {
        const groupRef = this.firebase.db.collection('lineGroups').doc(groupId);
        const groupDoc = await groupRef.get();
        if (!groupDoc.exists)
            throw new common_1.NotFoundException(`Group not found`);
        const membershipRef = groupRef.collection('memberships').doc(userId);
        const membershipDoc = await membershipRef.get();
        if (!membershipDoc.exists)
            throw new common_1.NotFoundException(`Membership not found`);
        const roleRef = membershipRef.collection('roles').doc(roleId);
        await roleRef.delete();
        return { success: true };
    }
};
exports.GroupsService = GroupsService;
exports.GroupsService = GroupsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [firebase_service_1.FirebaseService])
], GroupsService);
