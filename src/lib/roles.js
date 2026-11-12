import {
  ShieldAlert,
  HeartPulse,
  Sprout,
  GraduationCap,
  HandHelping,
  Landmark,
  Wrench,
  Map,
  Users
} from 'lucide-react';

/* ------------------------------------------------------------------ *
 * Role-Based Access Control (RBAC) Definitions for RDANA
 * 
 * 3 Access Levels:
 * 1. SUPER_ADMIN: Crissalen Danao - MDRRMO - RDANA Lead.
 *    Full system oversight, views all 8 agencies in Agency Impact hub.
 * 2. ADMIN: MDRRMO Admin / Operations Officer.
 *    Second highest authority. Access to MDRRMO interface. In impact tab,
 *    sees MDRRMO Impact directly (not the 8-agency grid).
 * 3. AGENCY: 7 Agency/Office Representatives (DepEd, MHO, OMAG, MSWDO,
 *    MASSO, MEO, MPDO). Custom sidebar: Overview, [Agency] Impact, Reports,
 *    Assessments.
 * ------------------------------------------------------------------ */

export const ROLE_LEVELS = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin_mdrrmo',
  AGENCY: 'agency'
};

export const ROLES = {
  super_admin: {
    id: 'super_admin',
    level: ROLE_LEVELS.SUPER_ADMIN,
    name: 'Crissalen Danao',
    roleLabel: 'Super Admin · MDRRMO - RDANA Lead',
    email: 'crissalen.danao@tagbina.gov.ph',
    initials: 'CD',
    agencyId: 'mdrrmo',
    agencyCode: 'MDRRMO',
    agencyName: 'MDRRMO Central Disaster Operations',
    icon: ShieldAlert,
    tone: 'brand',
    description: 'Full supervisory authority over municipal disaster response, multi-agency data consolidation, and OCD reporting.',
    isMvp: true
  },
  admin_mdrrmo: {
    id: 'admin_mdrrmo',
    level: ROLE_LEVELS.ADMIN,
    name: 'Engr. Roberto Dizon',
    roleLabel: 'MDRRMO Admin · Operations Officer',
    email: 'roberto.dizon@tagbina.gov.ph',
    initials: 'RD',
    agencyId: 'mdrrmo',
    agencyCode: 'MDRRMO',
    agencyName: 'MDRRMO Disaster Operations Office',
    icon: ShieldAlert,
    tone: 'brand',
    description: 'Second-highest authority. Manages MDRRMO tactical deployments and direct office impact metrics.',
    isMvp: true
  },
  agency_deped: {
    id: 'agency_deped',
    level: ROLE_LEVELS.AGENCY,
    name: 'Dr. Elena Ramos',
    roleLabel: 'Division Representative · Education Lead',
    email: 'elena.ramos@deped.gov.ph',
    initials: 'ER',
    agencyId: 'deped',
    agencyCode: 'DEPED',
    agencyName: 'Department of Education Division Office',
    impactLabel: 'DepEd Impact',
    icon: GraduationCap,
    tone: 'violet',
    description: 'Monitors school infrastructure damage, temporary learning spaces, and displaced students/teachers.',
    isMvp: true
  },
  agency_mho: {
    id: 'agency_mho',
    level: ROLE_LEVELS.AGENCY,
    name: 'Dr. Grace Lim',
    roleLabel: 'Municipal Health Officer · Health Lead',
    email: 'grace.lim@tagbina.gov.ph',
    initials: 'GL',
    agencyId: 'mho',
    agencyCode: 'MHO',
    agencyName: 'Municipal Health Office',
    impactLabel: 'MHO Impact',
    icon: HeartPulse,
    tone: 'blue',
    description: 'Tracks medical casualties, disease surveillance, health station damage, and emergency sanitation.',
    isMvp: true
  },
  agency_omag: {
    id: 'agency_omag',
    level: ROLE_LEVELS.AGENCY,
    name: 'Ramon Valderama',
    roleLabel: 'Municipal Agriculturist · Agri Lead',
    email: 'ramon.valderama@tagbina.gov.ph',
    initials: 'RV',
    agencyId: 'omag',
    agencyCode: 'OMAG',
    agencyName: 'Office of the Municipal Agriculturist',
    impactLabel: 'OMAG Impact',
    icon: Sprout,
    tone: 'green',
    description: 'Assesses crop damage, livestock losses, fisheries impact, and agricultural livelihood rehabilitation.',
    isMvp: true
  },
  agency_mswdo: {
    id: 'agency_mswdo',
    level: ROLE_LEVELS.AGENCY,
    name: 'Teresa Villanueva',
    roleLabel: 'Social Welfare Officer · Relief Lead',
    email: 'teresa.villanueva@tagbina.gov.ph',
    initials: 'TV',
    agencyId: 'mswdo',
    agencyCode: 'MSWDO',
    agencyName: 'Municipal Social Welfare & Development Office',
    impactLabel: 'MSWDO Impact',
    icon: HandHelping,
    tone: 'red',
    description: 'Evacuation center camp coordination, relief goods distribution, and vulnerable family tracking (Phase 2).',
    isMvp: false
  },
  agency_masso: {
    id: 'agency_masso',
    level: ROLE_LEVELS.AGENCY,
    name: 'Carlos Mendoza',
    roleLabel: 'Municipal Assessor · Real Property Lead',
    email: 'carlos.mendoza@tagbina.gov.ph',
    initials: 'CM',
    agencyId: 'masso',
    agencyCode: 'MASSO',
    agencyName: "Municipal Assessor's Office",
    impactLabel: 'MASSO Impact',
    icon: Landmark,
    tone: 'green',
    description: 'Appraisal of municipal real property damage, land-use zoning hazards, and cadastral valuations (Phase 2).',
    isMvp: false
  },
  agency_meo: {
    id: 'agency_meo',
    level: ROLE_LEVELS.AGENCY,
    name: 'Engr. Arthur Salazar',
    roleLabel: 'Municipal Engineer · Infrastructure Lead',
    email: 'arthur.salazar@tagbina.gov.ph',
    initials: 'AS',
    agencyId: 'meo',
    agencyCode: 'MEO',
    agencyName: 'Municipal Engineering Office',
    impactLabel: 'MEO Impact',
    icon: Wrench,
    tone: 'yellow',
    description: 'Structural integrity inspections of roads, bridges, public buildings, and drainage networks (Phase 2).',
    isMvp: false
  },
  agency_mpdo: {
    id: 'agency_mpdo',
    level: ROLE_LEVELS.AGENCY,
    name: 'Arch. Diana Cruz',
    roleLabel: 'Planning Coordinator · GIS Lead',
    email: 'diana.cruz@tagbina.gov.ph',
    initials: 'DC',
    agencyId: 'mpdo',
    agencyCode: 'MPDO',
    agencyName: 'Municipal Planning & Development Office',
    impactLabel: 'MPDO Impact',
    icon: Map,
    tone: 'navy',
    description: 'Long-term disaster rehabilitation planning, spatial hazard mapping, and capital project realignment (Phase 2).',
    isMvp: false
  }
};

export const ROLE_LIST = Object.values(ROLES);

export const DEFAULT_ROLE_ID = 'super_admin';
