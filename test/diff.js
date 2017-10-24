import test from "ava"
import diff from "../lib/diff"

test("a file is in the source but not the target", (t) => {
  let a = { path: "foo/bar", md5: "abc123" }

  let source = [a]
  let target = []

  let changes = diff({ source, target, locationProperty: "path", contentsHashProperty: "md5" })

	t.deepEqual(changes, {
    add: [a],
    remove: [],
    update: [],
    ignore: [],
  })
})

test("a file is in the target but not the source", (t) => {
  let a = { path: "foo/bar", md5: "abc123" }

  let source = []
  let target = [a]

  let changes = diff({ source, target, locationProperty: "path", contentsHashProperty: "md5" })

	t.deepEqual(changes, {
    add: [],
    remove: [a],
    update: [],
    ignore: [],
  })
})

test("a file is in both the target and the source but the hashes are different", (t) => {
  let aSource = { path: "foo/bar", md5: "abc123" }
  let aTarget = { path: "foo/bar", md5: "def456" }

  let source = [aSource]
  let target = [aTarget]

  let changes = diff({ source, target, locationProperty: "path", contentsHashProperty: "md5" })

	t.deepEqual(changes, {
    add: [],
    remove: [],
    update: [aSource],
    ignore: [],
  })
})

test("a file is in both the target and the source and the hashes are the same", (t) => {
  let aSource = { path: "foo/bar", md5: "abc123" }
  let aTarget = { path: "foo/bar", md5: "abc123" }

  let source = [aSource]
  let target = [aTarget]

  let changes = diff({ source, target, locationProperty: "path", contentsHashProperty: "md5" })

	t.deepEqual(changes, {
    add: [],
    remove: [],
    update: [],
    ignore: [aSource],
  })
})

test("a combination of files in different states", (t) => {
  let a = { path: "only/in/source" }
  let b = { path: "only/in/target" }
  let cSource = { path: "in/both/but/changed", md5: "abc123" }
  let cTarget = { path: "in/both/but/changed", md5: "def456" }
  let dSource = { path: "in/both/and/same", md5: "abc123" }
  let dTarget = { path: "in/both/and/same", md5: "abc123" }

  let source = [a, cSource, dSource]
  let target = [b, cTarget, dTarget]

  let changes = diff({ source, target, locationProperty: "path", contentsHashProperty: "md5" })

	t.deepEqual(changes, {
    add: [a],
    remove: [b],
    update: [cSource],
    ignore: [dSource],
  })
})
