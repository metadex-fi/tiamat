// fn do_remove_all (list: List<t>, item: t, found: Bool) -> (Bool, List<t>) {
//   when list is {
//     [] -> (found, [])
//     [x, ..xs] -> {
//       if x == item {
//         do_remove_all(xs, item, True)
//       } else {
//         let (found_, rest) = do_remove_all(xs, item, found)
//         (found_, [x, ..rest])
//       }
//     }
//   }
// }

// // removes all occurrences of the given element from the list and indicates if there were any
// pub fn remove_all (list: List<t>, item: t) -> (Bool, List<t>) {
//   do_remove_all(list, item, False)
// }

// removes first occurence of the given element from the list and indicates if it was found
// pub fn find_delete (list: List<t>, item: t) -> (Int, List<t>) {
//   when list is {
//     [] -> (0, [])
//     [x, ..xs] -> {
//       if x == item {
//         (1, xs)
//       } else {
//         let (found, rest) = find_delete(xs, item)
//         (found, [x, ..rest])
//       }
//     }
//   }
// }

pub fn find_delete_all(list: List<t>, item: t) -> (Int, List<t>) {
  when list is {
    [] -> (0, [])
    [x, ..xs] ->
      if x == item {
        let (found, rest) = find_delete_all(xs, item)
        (found + 1, rest)
      } else {
        let (found, rest) = find_delete_all(xs, item)
        (found, [x, ..rest])
      }
  }
}

// pub fn separate_at (list: List<t>, predicate: fn(t) -> Bool) -> (List<t>, Option<t>, List<t>) {
//   when list is {
//     [] -> ([], None, [])
//     [x, ..xs] -> {
//       if predicate(x) {
//         ([], Some(x), xs)
//       } else {
//         let (prev, found, after) = xs |> separate_at(predicate)
//         ([x, ..prev], found, after)
//       }
//     }
//   }
// }

pub fn find_transform(
  list: List<t>,
  predicate: fn(t) -> Bool,
  f: fn(t) -> t,
) -> List<t> {
  when list is {
    [] -> fail @"find_transform: element not found"
    [x, ..xs] ->
      if predicate(x) {
        [f(x), ..xs]
      } else {
        [x, ..find_transform(xs, predicate, f)]
      }
  }
}

pub fn transform_until_find(
  list: List<t>,
  predicate: fn(t) -> Bool,
  f: fn(t) -> t,
  g: fn(t) -> t,
) -> List<t> {
  when list is {
    [] -> fail @"transform_until_find: element not found"
    [x, ..xs] ->
      if predicate(x) {
        [g(x), ..xs]
      } else {
        [f(x), ..transform_until_find(xs, predicate, f, g)]
      }
  }
}

pub fn transform_until_delete(
  list: List<t>,
  predicate: fn(t) -> Bool,
  f: fn(t) -> t,
) -> List<t> {
  when list is {
    [] -> fail @"transform_until_delete: element not found"
    [x, ..xs] ->
      if predicate(x) {
        xs
      } else {
        [f(x), ..transform_until_delete(xs, predicate, f)]
      }
  }
}
// pub fn find_transform_after (list: List<t>, predicate: fn(t) -> Bool, f: fn(t) -> t) -> List<t> {
//   when list is {
//     [] -> error @"find_transform_after: element not found"
//     [x, ..xs] -> {
//       if predicate(x) {
//         [f(x), ..(xs |> map(f))]
//       } else {
//         [x, ..(xs |> find_transform_after(predicate, f))]
//       }
//     }
//   }
// }

// pub fn delete_transform_after (list: List<t>, predicate: fn(t) -> Bool, f: fn(t) -> t) -> List<t> {
//   when list is {
//     [] -> error @"delete_transform_after: element not found"
//     [x, ..xs] -> {
//       if predicate(x) {
//         xs |> map(f)
//       } else {
//         [x, ..(xs |> delete_transform_after(predicate, f))]
//       }
//     }
//   }
// }
