# Fundamentals
Storyfeed is loosely based on the [W3C Activity Streams 2.0 specification](https://www.w3.org/TR/activitystreams-core/){:target="_blank"}, adapted for use within Laravel applications. 
It is not an exact implementation of the spec, but rather a simplified version geared towards providing great developer experience.

## Anatomy of an Activity
An activity on a feed consists of four components:

- **Type**: a string that classifies what the activity is, such as "post", "like", or "comment"
- **Actor**: the entity that performed the action associated with the activity
- **Object**: the entity that the action was performed on
- **Target**: the entity that the activity is directed towards (optional)
- **Result**: the entity that describes the result of the activity (optional)

In an activity stream, the "Type" component provides a way to classify the activity and make it easier to filter or group similar types of activities together. For example, a "like" activity might represent a user liking a post, while a "comment" activity might represent a user commenting on a post.

The "Actor" represents the user or system that performed the action associated with the activity. For example, in the activity "John posted a photo", the actor would be "John".

The "Object" represents the entity that the action was performed on. In the same example, the object would be the photo that John posted.

Together, the "Actor" and "Object" provide context for the activity and help users understand what action was taken within the app. The "Target" component, if present, represents the entity that the activity is directed towards. For example, in the activity "John shared a post with Mary", the target would be "Mary".
