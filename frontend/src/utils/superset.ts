type WithSupersetGroup = { superset_group: string | null }

export function areSupersetted(exercises: WithSupersetGroup[], i: number): boolean {
  if (i < 0 || i + 1 >= exercises.length) return false
  const a = exercises[i].superset_group
  const b = exercises[i + 1].superset_group
  return Boolean(a) && a === b
}

export function toggleSupersetLink<T extends WithSupersetGroup>(exercises: T[], i: number): T[] {
  if (i < 0 || i + 1 >= exercises.length) return exercises

  const result = exercises.map((ex) => ({ ...ex })) as T[]
  const a = result[i]
  const b = result[i + 1]
  const currentlyLinked = a.superset_group !== null && a.superset_group === b.superset_group

  if (currentlyLinked) {
    // Split group at boundary i/i+1
    const oldGroup = a.superset_group!
    const newGroup = crypto.randomUUID().slice(0, 8)

    // Count members on each side of the split
    let beforeCount = 0
    let afterCount = 0
    for (let j = 0; j < result.length; j++) {
      if (result[j].superset_group === oldGroup) {
        if (j <= i) beforeCount++
        else afterCount++
      }
    }

    // Re-assign: before side keeps oldGroup (null if only 1), after side gets newGroup (null if only 1)
    for (let j = 0; j < result.length; j++) {
      if (result[j].superset_group === oldGroup) {
        if (j <= i) {
          result[j] = { ...result[j], superset_group: beforeCount > 1 ? oldGroup : null }
        } else {
          result[j] = { ...result[j], superset_group: afterCount > 1 ? newGroup : null }
        }
      }
    }
  } else {
    // Link: merge both into the same group
    const groupId = a.superset_group ?? b.superset_group ?? crypto.randomUUID().slice(0, 8)

    if (a.superset_group && b.superset_group && a.superset_group !== b.superset_group) {
      // Merge b's existing group into a's group
      const groupToReplace = b.superset_group
      for (let j = 0; j < result.length; j++) {
        if (result[j].superset_group === groupToReplace) {
          result[j] = { ...result[j], superset_group: a.superset_group }
        }
      }
    } else {
      result[i] = { ...result[i], superset_group: groupId }
      result[i + 1] = { ...result[i + 1], superset_group: groupId }
    }
  }

  return result
}
