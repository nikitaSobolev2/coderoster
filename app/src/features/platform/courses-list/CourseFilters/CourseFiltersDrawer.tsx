'use client'

import { useMediaQuery } from '@mantine/hooks'
import {
  Button,
  Checkbox,
  Drawer,
  ScrollArea,
  Stack,
  Switch,
  Text
} from '@mantine/core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faRotateLeft } from '@fortawesome/free-solid-svg-icons'
import type { CategoryRef, CoursesQuery, Difficulty, Language } from '~/server/repositories/types'
import PlatformDrawerHeader from '~/shared/components/ui/PlatformDrawerHeader'
import { DIFFICULTY_OPTIONS, LANGUAGE_OPTIONS } from './courseFiltersConfig'
import styles from './CourseFiltersDrawer.module.scss'

export interface Props {
  opened: boolean
  onClose: () => void
  filters: CoursesQuery
  onChange: (next: CoursesQuery) => void
  categories: CategoryRef[]
  defaults: CoursesQuery
  total: number
}

export default function CourseFiltersDrawer({
  opened,
  onClose,
  filters,
  onChange,
  categories,
  defaults,
  total
}: Readonly<Props>) {
  const update = (patch: Partial<CoursesQuery>) => onChange({ ...filters, ...patch })
  const drawerFullWidth = useMediaQuery('(max-width: 768px)')

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="left"
      size={drawerFullWidth ? '100vw' : 'min(100%, 380px)'}
      padding={0}
      withCloseButton={false}
      title={null}
      overlayProps={{ backgroundOpacity: 0.55, blur: 6 }}
      classNames={{ content: styles.drawerContent, body: styles.drawerBody }}
    >
      <div className={styles.panel}>
        <PlatformDrawerHeader
          title="Фильтры"
          onClose={onClose}
          closeAriaLabel="Закрыть фильтры"
          className={styles.drawerHeader}
        />

        <ScrollArea
          className={styles.feed}
          classNames={{ viewport: styles.feedViewport }}
          type="scroll"
          scrollbars="y"
          scrollbarSize={8}
        >
          <div className={styles.feedInner}>
            <section className={styles.section}>
              <Text component="h2" className={styles.sectionTitle}>
                Категория
              </Text>
              <Checkbox.Group
                value={filters.categorySlugs ?? []}
                onChange={values =>
                  update({ categorySlugs: values.length === 0 ? undefined : values })
                }
              >
                <Stack gap="sm" className={styles.checkboxStack}>
                  {categories.map(category => (
                    <Checkbox
                      key={category.slug}
                      value={category.slug}
                      label={category.title}
                      classNames={{ root: styles.checkboxRoot, label: styles.checkboxLabel }}
                      color="gray"
                      size="sm"
                    />
                  ))}
                </Stack>
              </Checkbox.Group>
            </section>

            <section className={styles.section}>
              <Text component="h2" className={styles.sectionTitle}>
                Язык
              </Text>
              <Checkbox.Group
                value={filters.languages ?? []}
                onChange={values =>
                  update({
                    languages: values.length === 0 ? undefined : (values as Language[])
                  })
                }
              >
                <Stack gap="sm" className={styles.checkboxStack}>
                  {LANGUAGE_OPTIONS.map(option => (
                    <Checkbox
                      key={option.value}
                      value={option.value}
                      label={option.label}
                      classNames={{ root: styles.checkboxRoot, label: styles.checkboxLabel }}
                      color="gray"
                      size="sm"
                    />
                  ))}
                </Stack>
              </Checkbox.Group>
            </section>

            <section className={styles.section}>
              <Text component="h2" className={styles.sectionTitle}>
                Уровень
              </Text>
              <Checkbox.Group
                value={filters.difficulties ?? []}
                onChange={values =>
                  update({
                    difficulties: values.length === 0 ? undefined : (values as Difficulty[])
                  })
                }
              >
                <Stack gap="sm" className={styles.checkboxStack}>
                  {DIFFICULTY_OPTIONS.map(option => (
                    <Checkbox
                      key={option.value}
                      value={option.value}
                      label={option.label}
                      classNames={{ root: styles.checkboxRoot, label: styles.checkboxLabel }}
                      color="gray"
                      size="sm"
                    />
                  ))}
                </Stack>
              </Checkbox.Group>
            </section>

            <section className={styles.section}>
              <Text component="h2" className={styles.sectionTitle}>
                Премиум / доступ
              </Text>
              <Stack gap="md">
                <Switch
                  label="Только бесплатные"
                  checked={Boolean(filters.freeOnly)}
                  onChange={e => update({ freeOnly: e.currentTarget.checked ? true : undefined })}
                />
                <Switch
                  label="Подходит для моего тарифа"
                  checked={Boolean(filters.matchesMyPlan)}
                  onChange={e =>
                    update({ matchesMyPlan: e.currentTarget.checked ? true : undefined })
                  }
                />
              </Stack>
            </section>
          </div>
        </ScrollArea>

        <footer className={styles.composer}>
          <div className={styles.composerCounterWrap}>
            <Text size="xs" c="dimmed" className={styles.resultMeta}>
              Найдено: <span className={styles.resultMetaStrong}>{total}</span>
            </Text>
          </div>
          <div className={styles.composerActionsRow}>
            <Button
              variant="default"
              leftSection={<FontAwesomeIcon icon={faRotateLeft} />}
              className={styles.footerReset}
              onClick={() => onChange({ ...defaults })}
            >
              Сбросить
            </Button>
            <Button
              leftSection={<FontAwesomeIcon icon={faCheck} />}
              className={styles.footerDone}
              onClick={onClose}
            >
              Готово
            </Button>
          </div>
        </footer>
      </div>
    </Drawer>
  )
}
