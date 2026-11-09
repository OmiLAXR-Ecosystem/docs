---
title: How OmiLAXR works
description: Pipelines, data providers and the path of a statement from a tracked object to an endpoint.
sidebar:
  order: 1
---

OmiLAXR is a learning analytics tracking framework for Unity and XR. Every part of it is a `MonoBehaviour`. You set up tracking by placing components in a scene or prefab, not by writing wiring code. When a component is enabled, it finds its collaborators in the scene hierarchy.

## Pipeline

A **pipeline** (`LearnerPipeline` for what learners do, `SystemPipeline` for what the application does) decides *what* is tracked. Its GameObject and its children hold:

1. **[Listeners](/core/components/#listeners)** find candidate objects in the scene: selectables, colliders, scene objects, and so on.
2. **[Filters](/core/components/#filters)** remove objects from that set, for example everything marked with `ExcludeFromTracking`.
3. **[Tracking behaviours](/core/components/#tracking-behaviours)** attach to the remaining objects and raise tracking events, such as "area entered" or "head nodded".
4. An **actor** (or actor group) and an **instructor** say whose data this is.

## Data provider

A **data provider** decides *what is sent where*. Data providers are found scene-wide. Each one owns these child components:

- **[Composers](/core/components/#composers)** subscribe to every tracking behaviour of their type and turn its events into statements. **Higher composers** look at the composed statements and produce aggregated statements.
- **[Hooks](/core/components/#hooks)** run in order on every statement. They can change it or drop it.
- **[Endpoints](/core/components/#endpoints)** send the statement: to a learning record store, a local file, a CSV file, the console, and so on.

The core is format-agnostic. [OmiLAXR.xAPI](/xapi/) implements the data provider for xAPI.

## Path of a statement

```
Tracking behaviour event → Composer → Higher composers → Hooks (in order) → every enabled Endpoint
```

## Extending OmiLAXR

New tracking goes into a module, not into the core. A **pipeline extension** on another GameObject registers its child listeners, filters and tracking behaviours with the pipeline. The XR modules ([UnityXR](/unityxr/), [MetaXR](/metaxr/), [MRTK2](/mrtk2/)) work this way. A module can also add its own filter, hook or endpoint.

Discovery happens in `Awake` and `OnEnable`, so the execution order matters: global settings first, then composers and extensions (−100), the data provider (−1) and the pipeline (0). Keep this order when you write your own pipeline components.
