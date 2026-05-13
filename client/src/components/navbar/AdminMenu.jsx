import { NavLink } from 'react-router-dom';
import { NavDropdown, dropdownLinkClass } from './NavHelpers';

export const AdminMenu = ({ t, closeMenu, openDropdown, setOpenDropdown }) => (
    <>
        <NavDropdown title={`🎓 ${t('students')}`} isOpen={openDropdown === 'stu'} toggleOpen={() => setOpenDropdown(openDropdown === 'stu' ? null : 'stu')}>
            <NavLink to="/students" className={dropdownLinkClass} onClick={closeMenu}>{t('students_list')}</NavLink>
            <NavLink to="/events/generator" className={dropdownLinkClass} onClick={closeMenu}>🎉 {t('event_cards')}</NavLink>
            <NavLink to="/high-scorers" className={dropdownLinkClass} onClick={closeMenu}>{t('high_scorers')}</NavLink>
            <NavLink to="/reports/batch" className={dropdownLinkClass} onClick={closeMenu}>{t('report_card')}</NavLink>
            <NavLink to="/id-cards" className={dropdownLinkClass} onClick={closeMenu}>🪪 {t('id_cards')}</NavLink>
            <NavLink to="/certificates" className={dropdownLinkClass} onClick={closeMenu}>🏆 {t('certificates')}</NavLink>
        </NavDropdown>

        <NavDropdown title={`📝 ${t('academics')}`} isOpen={openDropdown === 'acad'} toggleOpen={() => setOpenDropdown(openDropdown === 'acad' ? null : 'acad')}>
            <NavLink to="/grade-sheet" className={dropdownLinkClass} onClick={closeMenu}>{t('enter_grades')}</NavLink>
            <NavLink to="/manage-assessments" className={dropdownLinkClass} onClick={closeMenu}>{t('manage_assessments')}</NavLink>
            <NavLink to="/supportivesub" className={dropdownLinkClass} onClick={closeMenu}>{t('supportive_grades')}</NavLink>
            <NavLink to="/roster" className={dropdownLinkClass} onClick={closeMenu}>{t('class_roster')}</NavLink>
            <NavLink to="/schedule" className={dropdownLinkClass} onClick={closeMenu}>{t('Schedule')}</NavLink>
            <NavLink to="/master" className={dropdownLinkClass} onClick={closeMenu}>{t('all_class_schedule')}</NavLink>
        </NavDropdown>

        <NavDropdown title={`📊 ${t('analytics')}`} isOpen={openDropdown === 'ana'} toggleOpen={() => setOpenDropdown(openDropdown === 'ana' ? null : 'ana')}>
            <NavLink to="/allsubjectAnalysis" className={dropdownLinkClass} onClick={closeMenu}>{t('class_matrix')}</NavLink>
            <NavLink to="/subject-performance" className={dropdownLinkClass} onClick={closeMenu}>{t('subject_performance')}</NavLink>
            <NavLink to="/analytics" className={dropdownLinkClass} onClick={closeMenu}>{t('subject_detail')}</NavLink>
            <NavLink to="/at-risk" className={dropdownLinkClass} onClick={closeMenu}>⚠️ {t('at_risk')}</NavLink>
        </NavDropdown>

        <NavDropdown title={`⚙️ ${t('admin')}`} isOpen={openDropdown === 'adm'} toggleOpen={() => setOpenDropdown(openDropdown === 'adm' ? null : 'adm')}>
            <NavLink to="/subjects" className={dropdownLinkClass} onClick={closeMenu}>{t('manage_subjects')}</NavLink>
            <NavLink to="/admin/users" className={dropdownLinkClass} onClick={closeMenu}>{t('manage_staff')}</NavLink>
            <NavLink to="/supportivelist" className={dropdownLinkClass} onClick={closeMenu}>{t('supportive_subjects')}</NavLink>
            <NavLink to="/send_notification" className={dropdownLinkClass} onClick={closeMenu}>📢 {t('send_notification')}</NavLink>
            <NavLink to="/admin/quizzes" className={dropdownLinkClass} onClick={closeMenu}>{t('manage_quizzes')}</NavLink>
        </NavDropdown>
    </>
);