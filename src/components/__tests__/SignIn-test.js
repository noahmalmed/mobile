import 'react-native'
import React from 'react'
import renderer from 'react-test-renderer'
import { SignIn } from '../SignIn'

const navBarActions = {
  setNavbarBackButton: () => {}
}

it('renders correctly', () => {
  const tree = renderer.create(
    <SignIn isConnected={true} navBarActions={navBarActions} />
  ).toJSON()
  expect(tree).toMatchSnapshot()
})

it('renders error message', () => {
  const tree = renderer.create(
    <SignIn navBarActions={navBarActions} isConnected={true} errorMessage={'does not compute'} />
  ).toJSON()
  expect(tree).toMatchSnapshot()
})
