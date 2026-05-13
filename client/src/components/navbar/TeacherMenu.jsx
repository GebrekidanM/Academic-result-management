import { NavLink } from 'react-router-dom';
import { NavDropdown, dropdownLinkClass, navLinkClass } from './NavHelpers';

export const TeacherMenu = ({ t, closeMenu, openDropdown, setOpenDropdown, currentUser }) => (
    <>
        <NavLink to="/students" className={navLinkClass} onClick={closeMenu}>{t('students_list')}</NavLink>
        <NavDropdown title={`📝 ${t('academics')}`} isOpen={openDropdown === 'acad'} toggleOpen={() => setOpenDropdown(openDropdown === 'acad' ? null : 'acad')}>
            <NavLink to="/grade-sheet" className={dropdownLinkClass} onClick={closeMenu}>{t('enter_grades')}</NavLink>
            <NavLink to="/manage-assessments" className={dropdownLinkClass} onClick={closeMenu}>{t('manage_assessments')}</NavLink>
            <NavLink to="/supportivesub" className={dropdownLinkClass} onClick={closeMenu}>{t('supportive_grades')}</NavLink>
            {currentUser.homeroomGrade && <NavLink to="/roster" className={dropdownLinkClass} onClick={closeMenu}>{t('class_roster')}</NavLink>}
        </NavDropdown>

        <NavDropdown title={`📊 ${t('analytics')}`} isOpen={openDropdown === 'ana'} toggleOpen={() => setOpenDropdown(openDropdown === 'ana' ? null : 'ana')}>
            <NavLink to="/analytics" className={dropdownLinkClass} onClick={closeMenu}>{t('subject_detail')}</NavLink>
        </NavDropdown>
    </>
);